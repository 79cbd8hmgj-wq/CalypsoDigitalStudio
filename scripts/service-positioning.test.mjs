import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('homepage presents business software and website support as first-class services', async () => {
  const home = await read('src/pages/index.astro');
  assert.match(home, /href="\/business-software"/);
  assert.match(home, /href="\/website-support"/);
  assert.match(home, /NugNav/);
  const hero = home.split('<section class="services')[0];
  assert.doesNotMatch(hero, /\$89\.99/);
});

test('navigation gives custom software its own discovery route', async () => {
  const navigation = await read('src/data/navigation.ts');
  assert.match(navigation, /href: '\/business-software'/);
});

test('custom software page describes practical solutions and invites inquiries', async () => {
  const software = await read('src/pages/business-software.astro');
  for (const topic of ['Custom Business Software', 'dashboards', 'workflows', 'integrations', '/start']) {
    assert.ok(software.toLowerCase().includes(topic.toLowerCase()), `missing ${topic}`);
  }
});

test('technical support has a dedicated, specific inquiry path', async () => {
  const support = await read('src/pages/website-support.astro');
  for (const topic of ['Website Repairs', 'forms', 'mobile', 'performance', '/start']) {
    assert.ok(support.toLowerCase().includes(topic.toLowerCase()), `missing ${topic}`);
  }
});

test('service catalog distinguishes websites, software, automation and technical support', async () => {
  const services = await read('src/data/services.ts');
  for (const term of ['Website design and development', 'Custom business software', 'Workflow automation', 'Website repair']) {
    assert.ok(services.includes(term), `missing ${term}`);
  }
});

test('portfolio supports anchored software case-study navigation', async () => {
  const portfolio = await read('src/pages/work.astro');
  assert.match(portfolio, /id=\{`project-\$\{p\.data\.slug\}`\}/);
  assert.match(portfolio, /Websites and Custom Software Portfolio/);
});

test('sitemap contains the new service discovery pages', async () => {
  const sitemap = await read('public/sitemap.xml');
  assert.match(sitemap, /https:\/\/calypsodigital\.us\/business-software/);
  assert.match(sitemap, /https:\/\/calypsodigital\.us\/website-support/);
});

test('starter website price is scoped to the affordable offer in structured data', async () => {
  const layout = await read('src/layouts/BaseLayout.astro');
  assert.match(layout, /isAffordablePage/);
  assert.match(layout, /Custom business software/);
  assert.match(layout, /Website repair and technical support/);
});

test('quick inquiry covers custom software and repairs as well as websites', async () => {
  const start = await read('src/pages/start.astro');
  assert.match(start, /custom tool, an automation, or a technical fix/);
});
