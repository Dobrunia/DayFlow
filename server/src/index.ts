import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers/index.js';
import { createContext } from './lib/context.js';
import { wrapExecuteWithErrorHandler } from './lib/errors.js';
import { prisma } from './lib/prisma.js';
import { checkRateLimit } from './lib/rate-limiter.js';
import { RateLimitExceededError } from './lib/errors.js';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from './lib/constants.js';

// Absolute dir of *current file* (src in dev, dist in prod)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Env: загружаем .env; если нет — используем значения для локального теста
const envDir = join(__dirname, '..');
dotenv.config({ path: join(envDir, '.env') });

const defaults = {
  DATABASE_URL: 'mysql://dayflow:dayflow@localhost:3306/dayflow',
  CORS_ORIGINS: 'http://localhost:5173',
  PORT: '4000',
} as const;
for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? defaults.CORS_ORIGINS)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function getCorsOrigin(reqOrigin: string | null): string | null {
  if (!reqOrigin) return null;
  return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : null;
}

// Read GraphQL schema
const typeDefs = readFileSync(join(__dirname, 'schema', 'schema.graphql'), 'utf-8');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Логирование запросов и действий пользователя
function logPayload(operationName: string | undefined, userId: string | null, extra?: string) {
  const ts = new Date().toISOString();
  const user = userId ?? 'anonymous';
  const op = operationName ?? 'unknown';
  console.log(`[${ts}] ${op} | user=${user}${extra ? ` | ${extra}` : ''}`);
}

const yoga = createYoga({
  schema,
  plugins: [
    {
      onExecute: ({
        executeFn,
        setExecuteFn,
        args,
      }: {
        executeFn: (args: unknown) => Promise<unknown>;
        setExecuteFn: (fn: (args: unknown) => Promise<unknown>) => void;
        args: { operationName?: string; contextValue?: unknown; variableValues?: unknown };
      }) => {
        const op = args.operationName ?? undefined;
        const ctx = args.contextValue as { user?: { id: string } | null; ip?: string };
        const userId = ctx?.user?.id ?? null;
        const ip = ctx?.ip ?? 'unknown';
        
        // Rate limit by user ID or IP
        const rateLimitKey = userId ?? `ip:${ip}`;
        const { allowed } = checkRateLimit(rateLimitKey, {
          windowMs: RATE_LIMIT_WINDOW_MS,
          maxRequests: RATE_LIMIT_MAX_REQUESTS,
        });
        
        if (!allowed) {
          throw RateLimitExceededError();
        }
        
        const vars = args.variableValues as Record<string, unknown> | undefined;
        const safeVars =
          vars && typeof vars === 'object'
            ? Object.keys(vars)
                .filter((k) => k !== 'password')
                .join(',')
            : '';
        logPayload(op, userId, safeVars ? `vars=${safeVars}` : undefined);
        setExecuteFn((execArgs: unknown) => wrapExecuteWithErrorHandler(executeFn)(execArgs));
      },
    },
  ],
  context: createContext,
  cors: false, // CORS обрабатываем вручную в createServer (whitelist по Origin)
});

// Create HTTP server
const server = createServer(async (req, res) => {
  const reqOrigin = (req.headers.origin as string) ?? null;
  const origin = getCorsOrigin(reqOrigin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // Build request
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body:
      req.method !== 'GET' && req.method !== 'HEAD'
        ? new Uint8Array(
            await new Promise<Buffer>((resolve) => {
              const chunks: Buffer[] = [];
              req.on('data', (chunk) => chunks.push(chunk));
              req.on('end', () => resolve(Buffer.concat(chunks)));
            })
          )
        : undefined,
  });

  const response = await yoga.fetch(request, { req, res });

  const headers: Record<string, string | string[]> = {
    ...Object.fromEntries(response.headers.entries()),
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    Vary: 'Origin',
    'Access-Control-Allow-Credentials': 'true',
  };

  res.writeHead(response.status, headers);

  // Send response body
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
});

const PORT = Number(process.env.PORT ?? 4000);

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (e) {
    console.error('❌ Database connection failed:', e instanceof Error ? e.message : e);
  }
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (GraphQL at /graphql)`);
  });
}

start();
