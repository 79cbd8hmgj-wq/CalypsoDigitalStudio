import { formatClientEmail, formatOwnerEmail } from '../../src/lib/intake/email';
import { createSubmissionReference } from '../../src/lib/intake/reference';
import { sendResendEmail } from '../../src/lib/intake/resend';
import { MAX_REQUEST_BYTES, validateAndNormalizeIntake } from '../../src/lib/intake/schema';
import { verifyTurnstile } from '../../src/lib/intake/turnstile';

export interface Env {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  INTAKE_FROM_EMAIL: string;
  INTAKE_TO_EMAIL: string;
  INTAKE_ALLOWED_ORIGINS: string;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeTurnstileWidgetField(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const sanitized = structuredClone(input) as Record<string, unknown>;
  if (isRecord(sanitized.answers)) {
    delete sanitized.answers['cf-turnstile-response'];
  }
  return sanitized;
}

function parseAllowedOrigins(value: string): string[] {
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function allowedHostnames(origins: string[]): string[] {
  const hosts: string[] = [];
  for (const origin of origins) {
    try {
      hosts.push(new URL(origin).hostname);
    } catch {
      // Invalid environment values are ignored; the origin check will still fail closed.
    }
  }
  return [...new Set(hosts)];
}

function safeHoneypotReference(value: unknown): string {
  if (typeof value === 'object' && value !== null && 'submissionId' in value) {
    try {
      return createSubmissionReference(String((value as { submissionId: unknown }).submissionId));
    } catch {
      return 'CDS-RECEIVED';
    }
  }
  return 'CDS-RECEIVED';
}

export async function handleIntakeRequest(
  request: Request,
  env: Env,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false, code: 'unsupported_media_type' });
  }

  const declaredLength = Number(request.headers.get('Content-Length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return json(413, { ok: false, code: 'request_too_large' });
  }

  const origins = parseAllowedOrigins(env.INTAKE_ALLOWED_ORIGINS);
  const origin = request.headers.get('Origin') ?? '';
  if (!origins.includes(origin)) return json(403, { ok: false, code: 'origin_not_allowed' });

  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return json(400, { ok: false, code: 'invalid_json' });
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    return json(413, { ok: false, code: 'request_too_large' });
  }

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, code: 'invalid_json' });
  }

  if (typeof input === 'object' && input !== null && 'honeypot' in input &&
      typeof (input as { honeypot?: unknown }).honeypot === 'string' &&
      (input as { honeypot: string }).honeypot.trim()) {
    return json(200, {
      ok: true,
      reference: safeHoneypotReference(input),
      confirmationEmailSent: true
    });
  }

  const sanitizedInput = sanitizeTurnstileWidgetField(input);
  const validated = validateAndNormalizeIntake(sanitizedInput);
  if (!validated.ok) return json(400, { ok: false, code: 'validation_failed', issues: validated.issues });

  const turnstileToken = typeof sanitizedInput === 'object' && sanitizedInput !== null && 'turnstileToken' in sanitizedInput
    ? String((sanitizedInput as { turnstileToken: unknown }).turnstileToken)
    : '';
  const verification = await verifyTurnstile({
    secret: env.TURNSTILE_SECRET_KEY,
    token: turnstileToken,
    remoteIp: request.headers.get('CF-Connecting-IP') ?? '',
    allowedHostnames: allowedHostnames(origins),
    fetchImpl
  });
  if (!verification.ok) {
    return verification.code === 'verification_unavailable'
      ? json(503, { ok: false, code: verification.code })
      : json(400, { ok: false, code: verification.code });
  }

  const ownerEmail = formatOwnerEmail(validated.value);
  const ownerResult = await sendResendEmail({
    apiKey: env.RESEND_API_KEY,
    from: env.INTAKE_FROM_EMAIL,
    to: env.INTAKE_TO_EMAIL,
    content: ownerEmail,
    idempotencyKey: `intake-owner/${validated.value.submissionId}`,
    fetchImpl
  });
  if (!ownerResult.ok) return json(503, { ok: false, code: 'delivery_unconfirmed' });

  const clientEmail = formatClientEmail(validated.value);
  const clientResult = await sendResendEmail({
    apiKey: env.RESEND_API_KEY,
    from: env.INTAKE_FROM_EMAIL,
    to: validated.value.answers.business.email,
    content: clientEmail,
    idempotencyKey: `intake-client/${validated.value.submissionId}`,
    fetchImpl
  });

  return json(200, {
    ok: true,
    reference: validated.value.reference,
    confirmationEmailSent: clientResult.ok
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) =>
  handleIntakeRequest(context.request, context.env);
