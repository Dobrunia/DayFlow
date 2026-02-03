import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers/index.js';
import { createContext } from './lib/context.js';

// Absolute dir of *current file* (src in dev, dist in prod)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Env: загружаем .env; если нет — используем значения для локального теста
const envDir = join(__dirname, '..');
dotenv.config({ path: join(envDir, '.env') });

const defaults = {
  DATABASE_URL: 'mysql://dayflow:dayflow@localhost:3306/dayflow',
  SESSION_SECRET: 'dev-secret-local-only',
  CORS_ORIGIN: 'http://localhost:5173',
  PORT: '4000',
} as const;
for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? defaults.CORS_ORIGIN;

// Read GraphQL schema
const typeDefs = readFileSync(join(__dirname, 'schema', 'schema.graphql'), 'utf-8');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Cookie storage per request
const requestCookies = new WeakMap<
  Request,
  Map<string, { value: string; attributes: Record<string, unknown> } | null>
>();

// Логирование запросов и действий пользователя
function logPayload(
  operationName: string | undefined,
  userId: string | null,
  extra?: string
) {
  const ts = new Date().toISOString();
  const user = userId ?? 'anonymous';
  const op = operationName ?? 'unknown';
  console.log(`[${ts}] ${op} | user=${user}${extra ? ` | ${extra}` : ''}`);
}

const yoga = createYoga({
  schema,
  plugins: [
    {
      onExecute: ({ args }) => {
        const op = args.operationName ?? undefined;
        const ctx = args.contextValue as { user?: { id: string } | null };
        const userId = ctx?.user?.id ?? null;
        const vars = args.variableValues as Record<string, unknown> | undefined;
        const safeVars =
          vars && typeof vars === 'object'
            ? Object.keys(vars).filter((k) => k !== 'password').join(',')
            : '';
        logPayload(op, userId, safeVars ? `vars=${safeVars}` : undefined);
      },
    },
  ],
  context: async (ctx) => {
    const cookies = new Map<
      string,
      { value: string; attributes: Record<string, unknown> } | null
    >();
    requestCookies.set(ctx.request, cookies);

    const baseContext = await createContext(ctx);

    return {
      ...baseContext,
      setCookie: (name: string, value: string, attributes: Record<string, unknown>) => {
        cookies.set(name, { value, attributes });
      },
      deleteCookie: (name: string) => {
        cookies.set(name, null);
      },
    };
  },
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

// Create HTTP server
const server = createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
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

  // Process request through Yoga (логирование — в плагине onExecute)
  const response = await yoga.fetch(request, { req, res });

  // Get cookies set during request
  const cookies = requestCookies.get(request);
  const setCookieHeaders: string[] = [];

  if (cookies) {
    for (const [name, cookie] of cookies) {
      if (cookie === null) {
        // Delete cookie
        setCookieHeaders.push(`${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
      } else {
        // Set cookie
        let cookieStr = `${name}=${cookie.value}`;
        const attrs = cookie.attributes;

        if ((attrs as any).path) cookieStr += `; Path=${(attrs as any).path}`;
        if ((attrs as any).maxAge) cookieStr += `; Max-Age=${(attrs as any).maxAge}`;
        if ((attrs as any).expires)
          cookieStr += `; Expires=${((attrs as any).expires as Date).toUTCString()}`;
        if ((attrs as any).httpOnly) cookieStr += '; HttpOnly';
        if ((attrs as any).secure) cookieStr += '; Secure';
        if ((attrs as any).sameSite) cookieStr += `; SameSite=${(attrs as any).sameSite}`;

        setCookieHeaders.push(cookieStr);
      }
    }
    requestCookies.delete(request);
  }

  // Set response headers
  const headers: Record<string, string | string[]> = {
    ...Object.fromEntries(response.headers.entries()),
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
  };

  if (setCookieHeaders.length > 0) {
    headers['Set-Cookie'] = setCookieHeaders;
  }

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

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (GraphQL at /graphql)`);
});
