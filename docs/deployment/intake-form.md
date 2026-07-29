# Guided Intake Form Production Activation

The intake form is built to fail closed. Without a production Turnstile site key, the form remains readable and preserves local drafts, but the final submission button stays disabled. Do not enable production submission until every item below is complete.

## 1. Configure the sending identity

1. Use a domain controlled by Calypso Digital Studio for outgoing email.
2. Add that domain to Resend and complete its DNS verification.
3. Create a sender address on the verified domain for `INTAKE_FROM_EMAIL`.
4. Keep `calydigital@outlook.com` as `INTAKE_TO_EMAIL` and as the public correction/reply contact.
5. Create a restricted Resend API key used only by this Pages project.

Do not configure the Outlook address as the authenticated sender through Resend. The verified-domain sender and Outlook recipient serve different purposes.

## 2. Configure Turnstile

1. Create a Cloudflare Turnstile widget for the exact production hostname.
2. Add the production site key as `PUBLIC_TURNSTILE_SITE_KEY` during the Pages build.
3. Add the matching secret as `TURNSTILE_SECRET_KEY` for the Pages Function runtime.
4. Use Cloudflare’s published test keys only in automated tests and local development.
5. Confirm the browser widget uses the action `project-intake` and that the Function verifies the same action and production hostname.

## 3. Add Cloudflare Pages bindings

Configure these values in the Pages project. Secret values must never be committed.

```text
PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
RESEND_API_KEY
INTAKE_FROM_EMAIL
INTAKE_TO_EMAIL=calydigital@outlook.com
INTAKE_ALLOWED_ORIGINS=https://<production-hostname>
```

Include every allowed production origin explicitly. Do not use a wildcard origin.

## 4. Controlled production test

After deployment, submit one controlled request using a test business and an email address you can access. Verify all of the following before presenting the form as active:

- the six steps can be completed on a phone and desktop;
- Turnstile completes and is verified server-side;
- the owner email reaches `calydigital@outlook.com`;
- Reply-To points to the client’s submitted email;
- the client receives the confirmation and organized summary;
- both messages contain the same stable `CDS-XXXXXXXXXX` reference;
- the confirmation states 2–3 business days and does not generate a price;
- refreshing or closing an unfinished request restores the draft on the same device;
- a simulated network failure preserves every answer;
- retrying an accepted submission with the same UUID does not duplicate owner or client mail;
- a failed client-copy email still confirms that the owner received the request;
- no full submission body appears in Cloudflare production logs or analytics.

## 5. Activation rule

Submission remains disabled until the sender identity, all six bindings, production Turnstile hostname, owner delivery, client delivery, Reply-To behavior, and controlled retry are verified. A visually complete form is not sufficient evidence that delivery works.

## 6. Key rotation

When rotating Resend or Turnstile credentials:

1. create and deploy the replacement credential;
2. complete a controlled submission using the replacement;
3. confirm owner and client delivery;
4. revoke the previous credential only after verification.

This avoids an avoidable interruption in project inquiries.
