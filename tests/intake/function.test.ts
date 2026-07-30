import { expect, test, vi } from 'vitest';
import { handleIntakeRequest, type Env } from '../../functions/api/intake';
import { createValidWebsiteSubmission } from './fixtures';

const env: Env = {
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
  RESEND_API_KEY: 'resend-secret',
  INTAKE_FROM_EMAIL: 'Calypso <hello@example.com>',
  INTAKE_TO_EMAIL: 'calydigital@outlook.com',
  INTAKE_ALLOWED_ORIGINS: 'https://example.com,http://localhost:8788'
};

function requestFor(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/intake', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://example.com',
      ...headers
    },
    body: JSON.stringify(body)
  });
}

function acceptedFetch() {
  let emailIndex = 0;
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('siteverify')) {
      return new Response(JSON.stringify({ success: true, hostname: 'example.com', action: 'project-intake' }));
    }
    emailIndex += 1;
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe(
      emailIndex === 1
        ? 'intake-owner/11111111-2222-4333-8444-555555555555'
        : 'intake-client/11111111-2222-4333-8444-555555555555'
    );
    return new Response(JSON.stringify({ id: `email-${emailIndex}` }), { status: 200 });
  });
}

test('accepts a valid submission and sends owner then client emails', async () => {
  const fetchImpl = acceptedFetch();
  const response = await handleIntakeRequest(requestFor(createValidWebsiteSubmission()), env, fetchImpl);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, reference: 'CDS-1111111122', confirmationEmailSent: true });
  expect(fetchImpl).toHaveBeenCalledTimes(3);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});

test('ignores the Cloudflare Turnstile hidden response field inside project answers', async () => {
  const body = createValidWebsiteSubmission();
  (body.answers as unknown as Record<string, unknown>)['cf-turnstile-response'] = 'widget-token';
  const fetchImpl = acceptedFetch();

  const response = await handleIntakeRequest(requestFor(body), env, fetchImpl);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, reference: 'CDS-1111111122', confirmationEmailSent: true });
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});

test('rejects content type, body size, origin, and invalid JSON safely', async () => {
  const fetchImpl = vi.fn();
  expect((await handleIntakeRequest(requestFor({}, { 'Content-Type': 'text/plain' }), env, fetchImpl)).status).toBe(415);
  expect((await handleIntakeRequest(requestFor({}, { 'Content-Length': String(100 * 1024 + 1) }), env, fetchImpl)).status).toBe(413);
  expect((await handleIntakeRequest(requestFor({}, { Origin: 'https://evil.example' }), env, fetchImpl)).status).toBe(403);
  const invalid = new Request('https://example.com/api/intake', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' }, body: '{bad'
  });
  expect((await handleIntakeRequest(invalid, env, fetchImpl)).status).toBe(400);
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('honeypot returns generic success without external calls', async () => {
  const body = createValidWebsiteSubmission();
  body.honeypot = 'robot';
  const fetchImpl = vi.fn();
  const response = await handleIntakeRequest(requestFor(body), env, fetchImpl);
  expect(response.status).toBe(200);
  expect((await response.json())).toMatchObject({ ok: true });
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('returns field issues for invalid schema', async () => {
  const body = createValidWebsiteSubmission();
  body.answers.business.fullName = '';
  const response = await handleIntakeRequest(requestFor(body), env, vi.fn());
  expect(response.status).toBe(400);
  const payload = await response.json() as { code: string; issues: Array<{ path: string }> };
  expect(payload.code).toBe('validation_failed');
  expect(payload.issues.map((issue) => issue.path)).toContain('business.fullName');
});

test('maps Turnstile failures and outages', async () => {
  const failed = await handleIntakeRequest(
    requestFor(createValidWebsiteSubmission()), env,
    async () => new Response(JSON.stringify({ success: false }))
  );
  expect(failed.status).toBe(400);
  expect((await failed.json() as { code: string }).code).toBe('verification_failed');

  const unavailable = await handleIntakeRequest(
    requestFor(createValidWebsiteSubmission()), env,
    async () => { throw new Error('offline'); }
  );
  expect(unavailable.status).toBe(503);
});

test('does not attempt client email when owner delivery fails', async () => {
  let calls = 0;
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    calls += 1;
    if (String(input).includes('siteverify')) {
      return new Response(JSON.stringify({ success: true, hostname: 'example.com', action: 'project-intake' }));
    }
    return new Response('rejected', { status: 400 });
  });
  const response = await handleIntakeRequest(requestFor(createValidWebsiteSubmission()), env, fetchImpl);
  expect(response.status).toBe(503);
  expect(calls).toBe(2);
});

test('confirms receipt when only the client copy fails', async () => {
  let emails = 0;
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes('siteverify')) {
      return new Response(JSON.stringify({ success: true, hostname: 'example.com', action: 'project-intake' }));
    }
    emails += 1;
    return emails === 1
      ? new Response(JSON.stringify({ id: 'owner' }))
      : new Response('rejected', { status: 400 });
  });
  const response = await handleIntakeRequest(requestFor(createValidWebsiteSubmission()), env, fetchImpl);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, reference: 'CDS-1111111122', confirmationEmailSent: false });
});
