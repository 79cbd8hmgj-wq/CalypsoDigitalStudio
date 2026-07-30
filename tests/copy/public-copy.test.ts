import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');

const studioCopyPaths = [
  'src/pages/index.astro',
  'src/pages/services.astro',
  'src/pages/process.astro',
  'src/pages/work.astro',
  'src/pages/start.astro',
  'src/data/services.ts',
  'src/data/process.ts',
  'src/content/projects/lrl-photography.md',
  'src/content/projects/rare-treats-518.md',
  'src/content/projects/good-intentions.md',
  'src/components/SiteHeader.astro',
  'src/components/SiteFooter.astro',
  'src/components/ButtonLink.astro',
  'src/components/ProjectCard.astro',
  'src/data/navigation.ts',
  'public/site.webmanifest'
] as const;

test('studio marketing copy avoids em dashes, slash shorthand, and plural voice', async () => {
  const combined = (await Promise.all(studioCopyPaths.map(read))).join('\n');
  expect(combined).not.toContain('—');
  expect(combined).not.toMatch(/\bwe\b/i);
  expect(combined).not.toMatch(/\b(?:website\/app|email\/text|booking\/payments)\b/i);
  expect(combined).not.toContain('I also build');
  expect(combined).not.toContain('I will recommend');
  expect(combined).not.toContain('Tell me what the business needs');
});

test('approved copy and Evan biography remain present', async () => {
  const home = await read('src/pages/index.astro');
  const about = await read('src/pages/about.astro');
  const process = await read('src/data/process.ts');
  const start = await read('src/pages/start.astro');
  expect(home).toContain('You can begin without planning every part of the website.');
  expect(about).toContain('I’m Evan Lebrecht, the designer and developer behind Calypso Digital Studio.');
  expect(process).toContain('A discovery conversation confirms the goals');
  expect(start).toContain('Describe what the business needs in your own words. Technical language is not required.');
});
