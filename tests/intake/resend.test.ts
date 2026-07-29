import { expect, test, vi } from 'vitest';
import { sendResendEmail } from '../../src/lib/intake/resend';

const content = { subject: 'Subject', html: '<p>Hello</p>', text: 'Hello', replyTo: 'client@example.com' };

test('sends a Resend email with authorization and idempotency', async () => {
  const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer secret');
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('intake-owner/id');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      from: 'Calypso <hello@example.com>',
      to: ['owner@example.com'],
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
      reply_to: 'client@example.com'
    });
    return new Response(JSON.stringify({ id: 'email-id' }), { status: 200 });
  });
  const result = await sendResendEmail({
    apiKey: 'secret', from: 'Calypso <hello@example.com>', to: 'owner@example.com',
    content, idempotencyKey: 'intake-owner/id', fetchImpl
  });
  expect(fetchImpl).toHaveBeenCalledWith('https://api.resend.com/emails', expect.any(Object));
  expect(result).toEqual({ ok: true, emailId: 'email-id' });
});

test('returns safe provider failures without leaking response bodies', async () => {
  const rejected = await sendResendEmail({
    apiKey: 'secret', from: 'from@example.com', to: 'to@example.com', content,
    idempotencyKey: 'key', fetchImpl: async () => new Response('sensitive', { status: 400 })
  });
  expect(rejected).toEqual({ ok: false, code: 'email_provider_rejected' });

  const unavailable = await sendResendEmail({
    apiKey: 'secret', from: 'from@example.com', to: 'to@example.com', content,
    idempotencyKey: 'key', fetchImpl: async () => { throw new Error('network'); }
  });
  expect(unavailable).toEqual({ ok: false, code: 'email_provider_unavailable' });
});
