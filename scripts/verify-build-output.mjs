import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const routes = [
  ['/', 'Calypso Digital Studio | Web Design & Development in Albany, NY'],
  ['/services', 'Services | Calypso Digital Studio'],
  ['/affordable-web-design', 'Affordable Website Design in Albany, NY | Calypso Digital Studio'],
  ['/work', 'Work | Calypso Digital Studio'],
  ['/about', 'About | Calypso Digital Studio'],
  ['/process', 'Process | Calypso Digital Studio'],
  ['/start', 'Start Your Project | Calypso Digital Studio']
];
const errors = [];
let startHtml = '';
let affordableHtml = '';

for (const [route, title] of routes) {
  const name = route === '/' ? '../dist/index.html' : `../dist${route}/index.html`;
  const file = fileURLToPath(new URL(name, import.meta.url));
  try {
    const html = await readFile(file, 'utf8');
    if (route === '/start') startHtml = html;
    if (route === '/affordable-web-design') affordableHtml = html;
    if (!html.includes(`<title>${title.replaceAll('&', '&amp;')}</title>`)) errors.push(`${route}: missing expected title`);
    const canonical = `https://calypsodigital.us${route === '/' ? '/' : route}`;
    if (!html.includes(`rel="canonical" href="${canonical}"`)) errors.push(`${route}: missing correct canonical URL`);
    if (!html.includes('name="description"')) errors.push(`${route}: missing meta description`);
    if (!html.includes('id="main-content"')) errors.push(`${route}: missing main-content target`);
  } catch {
    errors.push(`${route}: build output missing`);
  }
}

for (const required of ['data-intake-form', 'Your Business', 'Project Type', 'Project Needs', 'Branding &amp; Materials', 'Review &amp; Contact', 'calydigital@outlook.com']) {
  if (!startHtml.includes(required)) errors.push(`/start: missing ${required}`);
}
for (const forbidden of ['Until the guided form is activated', 'What the full guided form will cover', 'Budget &amp; Timing', 'Approximate budget range', 'Preferred timing', 'How ready are you to begin?', 'Who makes the final project decision?', 'approximate budget']) {
  if (startHtml.includes(forbidden)) errors.push(`/start: old placeholder copy remains: ${forbidden}`);
}

for (const mustInclude of ['Affordable website design', '$89.99', 'one-page informational website', 'current, verifiable, written quote', '/services#price-guarantee', '/start']) {
  if (!affordableHtml.includes(mustInclude)) errors.push(`/affordable-web-design: missing ${mustInclude}`);
}
try {
  const sitemap = await readFile(fileURLToPath(new URL('../dist/sitemap.xml', import.meta.url)), 'utf8');
  for (const [route] of routes) {
    const canonical = `https://calypsodigital.us${route === '/' ? '/' : route}`;
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`sitemap: missing canonical ${canonical}`);
  }
  if (sitemap.includes('<loc>https://calypsodigital.us/services/</loc>')) errors.push('sitemap: inconsistent trailing-slash URL');
} catch {
  errors.push('sitemap: cannot read built sitemap');
}

for (const fileName of ['favicon.svg', 'site.webmanifest', 'robots.txt', 'sitemap.xml']) {
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
