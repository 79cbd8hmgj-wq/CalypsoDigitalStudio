import type { EmailContent } from './email';

export type ResendResult =
  | { ok: true; emailId: string }
  | { ok: false; code: 'email_provider_rejected' | 'email_provider_unavailable' };

export interface SendResendEmailOptions {
  apiKey: string;
  from: string;
  to: string;
  content: EmailContent;
  idempotencyKey: string;
  fetchImpl?: typeof fetch;
}

export async function sendResendEmail(options: SendResendEmailOptions): Promise<ResendResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': options.idempotencyKey
      },
      body: JSON.stringify({
        from: options.from,
        to: [options.to],
        subject: options.content.subject,
        html: options.content.html,
        text: options.content.text,
        reply_to: options.content.replyTo
      })
    });
    if (!response.ok) return { ok: false, code: 'email_provider_rejected' };
    const payload = await response.json().catch(() => null) as { id?: unknown } | null;
    if (!payload || typeof payload.id !== 'string') return { ok: false, code: 'email_provider_rejected' };
    return { ok: true, emailId: payload.id };
  } catch {
    return { ok: false, code: 'email_provider_unavailable' };
  }
}
