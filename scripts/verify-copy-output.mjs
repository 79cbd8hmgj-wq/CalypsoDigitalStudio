import { readdir, readFile } from 'node:fs/promises';
import { extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCopyViolations } from './copy-quality.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = fileURLToPath(new URL('../dist/', import.meta.url));
const extensions = new Set(['.html', '.js']);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (extensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const files = await collectFiles(distRoot);
const violations = [];
for (const file of files) {
  const source = relative(projectRoot, file);
  violations.push(...findCopyViolations(await readFile(file, 'utf8'), source));
}

if (violations.length > 0) {
  for (const item of violations) {
    console.error(`${item.source}: ${item.rule}: ${JSON.stringify(item.match)}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Copy verification passed for ${files.length} built files.`);
}
