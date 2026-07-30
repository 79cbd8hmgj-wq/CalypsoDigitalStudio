import { expect, test, vi } from 'vitest';
import { verifyTurnstile } from '../../src/lib/intake/turnstile';

test('verifies token, hostname, and action through Siteverify', async () => {
  const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body as FormData;
    expect(body.get('secret')).toBe('secret');
    expect(body.get('response')).toBe('token');
    expect(body.get('remoteip')).toBe('127.0.0.1');
    return new Response(JSON.stringify({ success: true, hostname: 'example.com', action: 'project-intake' }));
  });
  const result = await verifyTurnstile({
    secret: 'secret', token: 'token', remoteIp: '127.0.0.1', allowedHostnames: ['example.com'], fetchImpl
  });
  expect(result).toEqual({ ok: true });
  expect(fetchImpl).toHaveBeenCalledWith('https://challenges.cloudflare.com/turnstile/v0/siteverify', expect.any(Object));
});

test('rejects invalid tokens, hostnames, and actions safely', async () => {
  expect((await verifyTurnstile({
    secret: 'secret', token: '', remoteIp: '', allowedHostnames: ['example.com'], fetchImpl: fetch
  })).ok).toBe(false);

  const result = await verifyTurnstile({
    secret: 'secret', token: 'token', remoteIp: '', allowedHostnames: ['example.com'],
    fetchImpl: async () => new Response(JSON.stringify({ success: true, hostname: 'evil.example', action: 'other' }))
  });
  expect(result).toEqual({ ok: false, code: 'verification_failed' });
});

test('reports verification service outages safely', async () => {
  const result = await verifyTurnstile({
    secret: 'secret', token: 'token', remoteIp: '', allowedHostnames: ['example.com'],
    fetchImpl: async () => { throw new Error('offline'); }
  });
  expect(result).toEqual({ ok: false, code: 'verification_unavailable' });
});
