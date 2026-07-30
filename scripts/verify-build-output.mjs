import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const routes = [
  ['/', 'Calypso Digital Studio'],
  ['/services', 'Services | Calypso Digital Studio'],
  ['/work', 'Work | Calypso Digital Studio'],
  ['/about', 'About | Calypso Digital Studio'],
  ['/process', 'Process | Calypso Digital Studio'],
  ['/start', 'Start Your Project | Calypso Digital Studio']
];
const errors = [];
let startHtml = '';

for (const [route, title] of routes) {
  const name = route === '/' ? '../dist/index.html' : `../dist${route}/index.html`;
  const file = fileURLToPath(new URL(name, import.meta.url));
  try {
    const html = await readFile(file, 'utf8');
    if (route === '/start') startHtml = html;
    if (!html.includes(`<title>${title}</title>`)) errors.push(`${route}: missing expected title`);
    if (!html.includes('name="description"')) errors.push(`${route}: missing meta description`);
    if (!html.includes('id="main-content"')) errors.push(`${route}: missing main-content target`);
  } catch {
    errors.push(`${route}: build output missing`);
  }
}

for (const required of ['data-intake-form', 'Your Business', 'Project Type', 'Project Needs', 'Branding &amp; Materials', 'Budget &amp; Timing', 'Review &amp; Contact', 'calydigital@outlook.com']) {
  if (!startHtml.includes(required)) errors.push(`/start: missing ${required}`);
}
for (const forbidden of ['Until the guided form is activated', 'What the full guided form will cover']) {
  if (startHtml.includes(forbidden)) errors.push(`/start: old placeholder copy remains: ${forbidden}`);
}

for (const fileName of ['favicon.svg', 'site.webmanifest', 'robots.txt']) {
  try {
    await access(fileURLToPath(new URL(`../dist/${fileName}`, import.meta.url)));
  } catch {
    errors.push(`/${fileName}: missing from build`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified ${routes.length} routes, guided intake markup, and public metadata files.`);
}
