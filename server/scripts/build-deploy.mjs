import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

mkdirSync(dist, { recursive: true });

// 1. package.json first (so dist is deployable even if later steps fail)
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
const deployPkg = {
  name: pkg.name,
  version: pkg.version,
  type: 'module',
  scripts: {
    start: 'node index.js',
    postinstall: 'prisma generate',
    'db:push': 'prisma db push',
    'db:generate': 'prisma generate',
  },
  dependencies: {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies?.prisma ? { prisma: pkg.devDependencies.prisma } : {}),
  },
  engines: pkg.engines,
};
writeFileSync(join(dist, 'package.json'), JSON.stringify(deployPkg, null, 2));

// 2. .env template (read+write avoids Windows cpSync unlink quirks)
try {
  writeFileSync(join(dist, '.env.example'), readFileSync(join(root, '.env.example'), 'utf-8'));
} catch {
  // no .env.example
}

// 3. package-lock.json (for npm ci)
try {
  writeFileSync(
    join(dist, 'package-lock.json'),
    readFileSync(join(root, 'package-lock.json'), 'utf-8')
  );
} catch {
  // optional
}

// 4. GraphQL schema (tsc doesn't copy .graphql)
mkdirSync(join(dist, 'schema'), { recursive: true });
writeFileSync(
  join(dist, 'schema', 'schema.graphql'),
  readFileSync(join(root, 'src', 'schema', 'schema.graphql'), 'utf-8')
);

// 5. Prisma schema (read+write avoids Windows cpSync on long paths)
mkdirSync(join(dist, 'prisma'), { recursive: true });
writeFileSync(
  join(dist, 'prisma', 'schema.prisma'),
  readFileSync(join(root, 'prisma', 'schema.prisma'), 'utf-8')
);

console.log(
  'Deploy bundle ready in dist/\n  On server: cd dist && cp .env.example .env && npm ci && node index.js'
);
