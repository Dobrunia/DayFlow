import { config } from 'dotenv';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

config({ path: resolve(root, '.env') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://dayflow:dayflow@localhost:3306/dayflow';
  console.log('db:push: DATABASE_URL не задан, используем localhost (Docker)');
}

const url = process.env.DATABASE_URL;
const match = url.match(/@([^/]+)\/([^?]*)/);
console.log('db:push: подключаемся к', match ? `${match[1]}/${match[2]}` : '...');

const r = spawnSync('npx', ['prisma', 'db', 'push'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env },
  shell: true,
});

if (r.status !== 0) {
  console.error('db:push завершился с кодом', r.status);
}
process.exit(r.status ?? 1);
