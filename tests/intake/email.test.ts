import { expect, test } from 'vitest';
import { buildSummarySections, formatClientEmail, formatOwnerEmail } from '../../src/lib/intake/email';
import { validateAndNormalizeIntake } from '../../src/lib/intake/schema';
import { createValidWebsiteSubmission } from './fixtures';

function normalized() {
  const request = createValidWebsiteSubmission();
  const result = validateAndNormalizeIntake(request);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}

test('formats the owner notification with safe complete summaries', () => {
  const value = normalized();
  value.answers.business.difference = `Clear & calm <script>alert("x")</script> 'service'`;
  const email = formatOwnerEmail(value);
  expect(email.subject).toBe('New project inquiry — Example Studio — New business website — CDS-1111111122');
  expect(email.replyTo).toBe('jordan@example.com');
  for (const section of ['Business', 'Project', 'Needs', 'Materials', 'Contact']) {
    expect(email.text).toContain(section);
    expect(email.html).toContain(section.replace('&', '&amp;'));
  }
  expect(email.html).toContain('&amp;');
  expect(email.html).toContain('&lt;script&gt;');
  expect(email.html).not.toContain('<script>');
  expect(email.text).not.toContain('Budget & timing');
  expect(email.text).not.toContain('Product count');
});

test('excludes budget, timing, readiness, launch, and approval data from summaries', () => {
  const value = normalized();
  Object.assign(value.answers.budgetAndTiming, {
    budgetRange: '1000-2500', preferredTiming: '1-3-months', launchDate: '2026-10-01',
    deadlineContext: 'Seasonal launch', readiness: 'ready', decisionMaker: 'client', otherApprovers: 'Business partner'
  });
  const sections = buildSummarySections(value);
  const combined = JSON.stringify(sections);
  expect(sections.map((section) => section.title)).toEqual(['Business', 'Project', 'Needs', 'Materials', 'Contact']);
  for (const removed of ['Budget & timing', 'Budget range', 'Preferred timing', 'Desired launch date', 'Deadline context', 'Readiness', 'Decision maker', 'Other approvers', 'Seasonal launch', 'Business partner']) {
    expect(combined).not.toContain(removed);
  }
});

test('formats the client confirmation with response expectations', () => {
  const email = formatClientEmail(normalized());
  expect(email.subject).toContain('CDS-1111111122');
  expect(email.text).toContain('2–3 business days');
  expect(email.text).toContain('No quote has been generated');
  expect(email.text).toContain('does not commit you to purchasing');
});
