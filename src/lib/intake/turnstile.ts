export type TurnstileResult =
  | { ok: true }
  | { ok: false; code: 'verification_failed' | 'verification_unavailable' };

export interface VerifyTurnstileOptions {
  secret: string;
  token: string;
  remoteIp: string;
  allowedHostnames: string[];
  fetchImpl?: typeof fetch;
}

export async function verifyTurnstile(options: VerifyTurnstileOptions): Promise<TurnstileResult> {
  if (!options.token || options.token.length > 2048) return { ok: false, code: 'verification_failed' };
  const body = new FormData();
  body.set('secret', options.secret);
  body.set('response', options.token);
  if (options.remoteIp) body.set('remoteip', options.remoteIp);
  try {
    const response = await (options.fetchImpl ?? fetch)('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body
    });
    if (!response.ok) return { ok: false, code: 'verification_unavailable' };
    const payload = await response.json().catch(() => null) as {
      success?: unknown;
      hostname?: unknown;
      action?: unknown;
    } | null;
    if (!payload || payload.success !== true || typeof payload.hostname !== 'string' ||
        !options.allowedHostnames.includes(payload.hostname) || payload.action !== 'project-intake') {
      return { ok: false, code: 'verification_failed' };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: 'verification_unavailable' };
  }
}
