import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);
const DIST_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

function latestMtimeMs(dir, extensions) {
  if (!fs.existsSync(dir)) return 0;

  let latest = 0;
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!extensions.has(path.extname(entry.name))) continue;

      const mtimeMs = fs.statSync(fullPath).mtimeMs;
      if (mtimeMs > latest) latest = mtimeMs;
    }
  }

  return latest;
}

function toIso(ms) {
  return new Date(ms).toISOString();
}

if (process.env.ALLOW_STALE_DIST === '1') {
  process.exit(0);
}

if (!fs.existsSync(distDir)) {
  console.error('[start-guard] Missing dist/ output. Run "npm run build" before "npm start".');
  process.exit(1);
}

const latestSrc = latestMtimeMs(srcDir, SOURCE_EXTENSIONS);
const latestDist = latestMtimeMs(distDir, DIST_EXTENSIONS);

if (!latestDist) {
  console.error('[start-guard] dist/ has no compiled JavaScript files. Run "npm run build" before "npm start".');
  process.exit(1);
}

if (latestSrc > latestDist + 1000) {
  console.error('[start-guard] Refusing to start with stale dist/ artifacts.');
  console.error(`[start-guard] Latest src change:  ${toIso(latestSrc)}`);
  console.error(`[start-guard] Latest dist change: ${toIso(latestDist)}`);
  console.error('[start-guard] Run "npm run build" and retry "npm start".');
  process.exit(1);
}
