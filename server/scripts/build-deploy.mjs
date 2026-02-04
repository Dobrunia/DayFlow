import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const srcPath = join(src, name);
    const destPath = join(dest, name);
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..'); // server/
const dist = join(root, 'dist');                                 // server/dist
const readJson = (p) => JSON.parse(readFileSync(p, 'utf-8'));
const writeJson = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 2));

console.log('[build-deploy] root =', root);
console.log('[build-deploy] dist =', dist);

rmSync(dist, { recursive: true, force: true });
console.log('[build-deploy] rm dist OK');
mkdirSync(dist, { recursive: true });

const buildDir = join(root, 'build');
console.log('[build-deploy] buildDir =', buildDir, 'exists =', existsSync(buildDir));
if (!existsSync(buildDir)) {
  throw new Error(`build/ not found: ${buildDir}\nRun: npx tsc (outDir is build)`);
}
try {
  copyDirRecursive(buildDir, dist);
} catch (err) {
  console.error('[build-deploy] copy build failed:', err.message);
  throw err;
}
console.log('[build-deploy] cp build → dist OK');

/**
 * 1) Read server package.json
 */
const pkg = readJson(join(root, 'package.json'));

/**
 * 2) Bundle shared into server/dist/shared
 */
const sharedPath = join(root, '..', 'shared');   // ../shared
const sharedOut = join(dist, 'shared');          // server/dist/shared
mkdirSync(sharedOut, { recursive: true });

const sharedDistIn = join(sharedPath, 'dist');
if (!existsSync(sharedDistIn)) {
  throw new Error(
    `Shared build not found: ${sharedDistIn}\n` +
    `Run: cd ../shared && npm run build`
  );
}

// copy shared compiled output
copyDirRecursive(sharedDistIn, join(sharedOut, 'dist'));

// sanity check: ensure entry exists in deploy bundle
const sharedEntryJsAbs = join(sharedOut, 'dist', 'index.js');
if (!existsSync(sharedEntryJsAbs)) {
  throw new Error(
    `Shared entry not found after copy: ${sharedEntryJsAbs}\n` +
    `Check that ../shared/dist/index.js exists and is being copied.`
  );
}

/**
 * 2.1) Generate deploy shared/package.json
 * IMPORTANT: keep exports for "." and "./backend" like in your original shared package.json
 */
const sharedPkg = readJson(join(sharedPath, 'package.json'));

const deploySharedPkg = {
  name: sharedPkg.name ?? 'dayflow-shared',
  version: sharedPkg.version ?? '0.0.0',
  type: 'module',
  main: './dist/index.js',
  types: './dist/index.d.ts',
  exports: {
    '.': {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    },
    './backend': {
      types: './dist/backend.d.ts',
      default: './dist/backend.js',
    },
  },
  // зависимости shared (если нужны рантайму) — оставляем
  dependencies: sharedPkg.dependencies ?? undefined,
  peerDependencies: sharedPkg.peerDependencies ?? undefined,
  peerDependenciesMeta: sharedPkg.peerDependenciesMeta ?? undefined,
};

writeJson(join(sharedOut, 'package.json'), deploySharedPkg);
console.log('[build-deploy] shared → dist/shared OK');

/**
 * 3) Create deploy package.json in server/dist
 *    dayflow-shared ВСЕГДА file:./shared (в dist лежит dist/shared)
 */
const rawDeps = pkg.dependencies ?? {};
const deployDeps = {};
for (const k of Object.keys(rawDeps)) {
  deployDeps[k] = k === 'dayflow-shared' ? 'file:./shared' : rawDeps[k];
}
if (!('dayflow-shared' in rawDeps)) deployDeps['dayflow-shared'] = 'file:./shared';
if (pkg.devDependencies?.prisma) deployDeps.prisma = pkg.devDependencies.prisma;

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
  dependencies: deployDeps,
  engines: pkg.engines,
};
if (deployDeps['dayflow-shared'] !== 'file:./shared') {
  throw new Error('deployDeps.dayflow-shared must be file:./shared, got: ' + deployDeps['dayflow-shared']);
}
const distPkgPath = join(dist, 'package.json');
writeFileSync(distPkgPath, JSON.stringify(deployPkg, null, 2));
console.log('[build-deploy] dist/package.json written, dayflow-shared =', deployDeps['dayflow-shared']);

/**
 * 4) Copy .env.example (optional)
 */
const envExample = join(root, '.env.example');
if (existsSync(envExample)) {
  writeFileSync(join(dist, '.env.example'), readFileSync(envExample, 'utf-8'));
}

/**
 * 5) Lockfile не копируем: на сервере только npm install.
 *    npm ci с патченным lock даёт "missing target shared"; npm install по package.json + file:./shared работает.
 */

/**
 * 6) Copy GraphQL schema (tsc doesn't copy .graphql)
 */
mkdirSync(join(dist, 'schema'), { recursive: true });
writeFileSync(
  join(dist, 'schema', 'schema.graphql'),
  readFileSync(join(root, 'src', 'schema', 'schema.graphql'), 'utf-8')
);

/**
 * 7) Copy Prisma schema
 */
mkdirSync(join(dist, 'prisma'), { recursive: true });
writeFileSync(
  join(dist, 'prisma', 'schema.prisma'),
  readFileSync(join(root, 'prisma', 'schema.prisma'), 'utf-8')
);
console.log('[build-deploy] schema + prisma OK');

console.log(
  '[build-deploy] DONE. Deploy bundle: ' + dist + '\n' +
  '  On server: upload folder + .env → npm install (не ci) → node index.js\n'
);
