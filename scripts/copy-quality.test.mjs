import test from 'node:test';
import assert from 'node:assert/strict';
import { findCopyViolations } from './copy-quality.mjs';

test('finds prohibited customer-facing copy patterns', () => {
  const text = 'Tell me about the business—then choose website/app support.';
  const violations = findCopyViolations(text, 'fixture.html');
  assert.deepEqual(
    violations.map((item) => item.rule),
    ['unnecessary em dash', 'slash-heavy shorthand', 'retired studio wording']
  );
});

test('allows necessary compounds, URLs, and Evan first-person biography', () => {
  const text = [
    'Purpose-built software can support one-time work and follow-up requests.',
    'A small-business website can link to https://example.com/start.',
    'I’m Evan Lebrecht, the designer and developer behind Calypso Digital Studio.'
  ].join(' ');
  assert.deepEqual(findCopyViolations(text, 'allowed.html'), []);
});
