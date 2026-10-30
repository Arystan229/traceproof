import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve('.');
const output = path.join(root, 'outputs/traceproof');
const source = path.join(output, 'source');
await mkdir(source, { recursive: true });
const entries = ['app', 'components', 'db', 'docs', 'drizzle', 'hooks', 'lib', 'portable', 'public', 'scripts', 'tests', 'vendor', 'worker', '.env.example', '.gitignore', '.npmrc', 'cloudflare-env.d.ts', 'components.json', 'drizzle.config.ts', 'eslint.config.mjs', 'LICENSE', 'next-env.d.ts', 'next.config.ts', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'postcss.config.mjs', 'README.md', 'tsconfig.json', 'vite-env.d.ts', 'vite.config.ts'];
for (const entry of entries) await cp(path.join(root, entry), path.join(source, entry), { recursive: true });
await mkdir(path.join(source, '.openai'), { recursive: true });
await cp(path.join(root, '.openai/hosting.json'), path.join(source, '.openai/hosting.json'));
for (const file of ['DEVPOST_SUBMISSION.md', 'DEMO_SCRIPT.md', 'EVALUATION.md']) await cp(path.join(root, 'docs', file), path.join(output, file));
async function files(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await files(name)); else result.push(name);
  }
  return result;
}
const manifest = [];
for (const file of (await files(output)).sort()) {
  if (path.basename(file) === 'SHA256SUMS.txt') continue;
  const bytes = await readFile(file);
  manifest.push(`${createHash('sha256').update(bytes).digest('hex')}  ${path.relative(output, file).replaceAll('\\', '/')}`);
}
await writeFile(path.join(output, 'SHA256SUMS.txt'), manifest.join('\n') + '\n');
console.log(`Prepared ${manifest.length} release files in ${output}. Dependencies, credentials and temporary build state are excluded.`);
