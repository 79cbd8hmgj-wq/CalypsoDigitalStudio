# Calypso Digital Studio Guided Intake Form Design

**Date:** 2026-07-29  
**Status:** Approved design, awaiting written-spec review  
**Owner:** Evan Lebrecht / Calypso Digital Studio

## 1. Purpose

Replace the current Start Your Project placeholder with a complete, step-by-step client intake form.

The form must help a prospective client explain their business and project without needing web-development or software terminology. It must collect enough organized information for Evan to review the request personally and prepare a custom recommendation and quote.

The form must not calculate, display, imply, or guarantee a price.

## 2. Success criteria

The finished form must:

- work as a real submission form rather than a list of future features;
- be comfortable to complete at 390px and 430px phone widths;
- explain unfamiliar options in plain business language;
- ask only questions relevant to the selected project;
- support one primary project type plus optional add-ons;
- save unfinished progress on the visitor's current device;
- provide a review-and-edit screen before submission;
- send an organized project summary to `calydigital@outlook.com`;
- send the client an automatic confirmation and copy of their answers;
- promise a personal response within 2–3 business days;
- protect the endpoint from automated spam;
- preserve answers after validation, network, verification, or email errors; and
- match the existing Warm Creative Workshop visual system.

## 3. Product scope

### Included

- Six-step guided wizard
- One primary project type
- Optional add-ons
- Conditional questions
- Browser-based draft recovery
- Review and edit actions
- Client-side and server-side validation
- Cloudflare Turnstile protection
- Business notification email
- Client confirmation email
- Stable submission reference
- Accessible errors and keyboard navigation
- Plain-language data-use notice

### Excluded from the first release

- Accounts or logins
- File uploads
- Public pricing estimates
- Automatic quotes
- Payments or deposits
- Appointment scheduling
- Client portal
- Administrative dashboard
- Cross-device draft syncing
- Permanent database storage
- Marketing-email enrollment

The first release deliberately uses the owner notification email as the business record. A database or project dashboard is a separate future project only if submission volume justifies it.

## 4. Overall experience

The Start Your Project page begins with a short introduction stating:

- the form usually takes 5–10 minutes;
- technical knowledge is not required;
- no price will be generated;
- submission does not commit the visitor to purchasing services;
- unfinished progress is saved on the current device for 30 days;
- no files are needed at this stage; and
- Evan will personally review the request within 2–3 business days.

The primary action is **Start Your Project**.

When a valid unfinished draft exists, the visitor chooses:

- **Continue saved project**
- **Start over**

Starting over requires confirmation before deleting saved answers.

## 5. Wizard structure

The form contains six named steps:

1. Your Business
2. Project Type
3. Project Needs
4. Branding & Materials
5. Budget & Timing
6. Review & Contact

The success screen is not counted as a step.

Every step includes:

- step name;
- `Step X of 6`;
- a one-sentence explanation;
- only relevant fields;
- **Back** and **Continue** controls; and
- a `Saved on this device` status only after a successful local save.

The last step uses **Submit Project Details** instead of Continue.

The active step is reflected in the URL hash using `#business`, `#project`, `#needs`, `#materials`, `#budget`, and `#review`.

Browser Back and Forward may move only among the current and previously completed steps. A direct hash pointing to a future incomplete step redirects to the first incomplete step.

## 6. Step 1 — Your Business

Purpose: understand the client, business, and audience before discussing features.

| Field | Requirement | Rule |
| --- | --- | --- |
| Full name | Required | Maximum 120 characters |
| Business or project name | Required | Maximum 120 characters; `Not decided yet` is valid |
| Email address | Required | Maximum 254 characters |
| Phone number | Optional initially | Required later for phone or text contact |
| Business location | Required | Maximum 120 characters; may be `Online only` |
| Service area | Required | Local, regional, nationwide, online, or combination |
| Existing website | Optional | Normalized HTTP or HTTPS URL |
| Social links | Optional | Up to five URLs |
| What does the business offer? | Required | Maximum 2,000 characters |
| Who are the main customers? | Required | Maximum 2,000 characters |
| What makes the business different? | Optional | Maximum 2,000 characters; `Still figuring this out` is valid |

Broad questions include short examples beneath their labels. Examples are never prefilled as client answers.

## 7. Step 2 — Project Type

### Primary project type

The client selects exactly one:

- **New business website** — build a professional website from the beginning.
- **Website redesign** — replace, reorganize, or improve an existing website.
- **Online store** — sell products, accept payments, and organize purchasing steps.
- **Custom digital tool** — improve a repeated business process with purpose-built software.
- **Ongoing website support** — fix, improve, or maintain an existing website.
- **Not sure yet** — describe the problem and receive a recommendation.

### Optional add-ons

The client may select any relevant additions:

- Booking or appointment requests
- Online payments
- Product sales
- Custom contact, intake, or quote forms
- Photo gallery or portfolio
- Customer reviews or testimonials
- Email signup
- Blog or updates section
- Website maintenance
- Search-engine setup
- Visitor analytics
- Business email setup
- Something else

Selecting an add-on reveals only its related questions in Step 3.

### Changing selections

Changing the primary type after conditional answers exist requires confirmation. Confirming the change removes answers that are incompatible with the new type.

Removing an add-on clears answers that belong only to that add-on. Shared answers remain.

## 8. Step 3 — Project Needs

Every client selects at least one main goal:

- Look more professional
- Help customers understand the business
- Generate inquiries
- Accept bookings
- Sell products
- Improve an existing process
- Replace manual paperwork
- Make information easier to manage
- Something else

An Other explanation is required when Something Else is selected and is limited to 500 characters.

### 8.1 New website path

Expected pages:

- Home
- About
- Services
- Individual service pages
- Portfolio or gallery
- Testimonials
- Frequently asked questions
- Contact
- Booking
- Policies
- Blog or updates
- Other
- Not sure yet

Expected functionality:

- Contact form
- Quote-request form
- Booking request
- Map or service-area information
- Social media links
- Reviews or testimonials
- Photo gallery
- Downloadable documents
- Email signup
- Online payment
- Members-only content
- Multiple locations
- Other
- Not sure yet

The page explains that the client is not responsible for determining the final page count. Evan will recommend the clearest structure after review.

### 8.2 Website redesign path

This path includes the standard website questions plus:

- current website address — required if absent from Step 1;
- current platform — optional, with `I do not know`;
- what currently works well — maximum 2,000 characters;
- what needs to change most — required, maximum 2,000 characters;
- written content reuse, rewrite, or review preference;
- photo and media reuse preference;
- whether content must be migrated; and
- anything broken or preventing customers from acting — maximum 2,000 characters.

### 8.3 Online store path

Store questions appear when the primary type is Online Store or Product Sales is selected as an add-on.

- Product count: 1–10, 11–25, 26–50, 51–100, more than 100, not sure
- Approximate category count
- Product type: physical, digital, made-to-order, service-based, or combination
- Variations such as size, color, flavor, package, or personalization
- Shipping needed
- Local delivery needed
- Local pickup needed
- Inventory tracking needed
- Discount codes or promotions needed
- Custom orders or customer notes needed
- Tax setup understood, guidance needed, or not sure
- Existing payment provider
- Product descriptions available or still needed
- Product photos available or still needed
- Existing store or catalog requiring migration

The form records needs but does not provide tax, legal, shipping, or payment-processing advice.

### 8.4 Custom digital tool path

This path asks about the business process, not technical architecture:

- task or process to improve — required, maximum 3,000 characters;
- how it is handled now — required, maximum 3,000 characters;
- who uses it — required, maximum 1,000 characters;
- information entering the process — maximum 2,000 characters;
- expected output, calculation, organization, or completed result — required, maximum 3,000 characters;
- access levels for owners, staff, or customers;
- reminders, updates, or notifications;
- reports, printable summaries, or downloads;
- primary devices: phones, computers, tablets, or combination;
- existing software it must work with — maximum 1,000 characters;
- biggest current problem — required, maximum 2,000 characters; and
- what successful everyday use looks like — required, maximum 2,000 characters.

The client is never asked to choose a language, framework, database, API, host, or other implementation technology.

### 8.5 Ongoing website support path

- Current website address — required if absent from Step 1
- Current platform — optional, with `I do not know`
- Help needed: content updates, visual changes, broken feature, performance, mobile layout, maintenance, security concern, new feature, other
- One-time or recurring support
- Urgency: normal, time-sensitive, partly unusable, unavailable
- What is happening now — required, maximum 2,000 characters
- Needed result — required, maximum 2,000 characters
- Access to domain, hosting, and website account: yes, partial, no, not sure

Urgency helps Evan prioritize review but does not promise emergency availability.

### 8.6 Not sure yet path

- What should the business do better online? — required, maximum 2,000 characters
- What problem is happening now? — required, maximum 2,000 characters
- What should customers or staff be able to do? — required, maximum 2,000 characters
- Does a website already exist?
- Which outcomes matter most?

Evan uses these answers to recommend the appropriate project type.

### 8.7 Add-on questions

**Booking or appointment requests**

- Request-only or immediately confirmed booking
- Types of appointments or services — maximum 1,000 characters
- Existing calendar or booking service
- Deposit required, not required, or not sure

**Online payments without product sales**

- Purpose: deposits, invoices, service payments, donations, memberships, other
- Existing payment provider

**Custom forms**

- Who completes the form — maximum 500 characters
- Information it should collect — maximum 2,000 characters
- What should happen after submission — maximum 2,000 characters

**Website maintenance**

- One-time cleanup or recurring help
- Expected update frequency

**Something else**

- Required explanation, maximum 1,000 characters

## 9. Step 4 — Branding & Materials

### Available materials

Clients indicate what already exists:

- Logo
- Brand colors
- Preferred fonts
- Professional business photos
- Product photos
- Written page content
- Service descriptions
- Product information
- Customer testimonials
- Domain name
- Website hosting
- Business email
- Privacy policy or other business policies
- Existing website content
- None of these yet

Selecting None of These Yet requires confirmation and clears all other material selections.

The form states that no files are needed now. Evan will request required materials after reviewing the submission.

### Visual direction

- Choose up to three descriptive words
- Existing brand elements that must remain — maximum 1,000 characters
- Colors or styles to avoid — maximum 1,000 characters
- Up to three websites the client likes
- What they like about those examples — maximum 2,000 characters
- Up to three websites the client dislikes
- What they dislike about those examples — maximum 2,000 characters

Suggested words: warm, bold, modern, playful, elegant, minimal, professional, earthy, luxurious, energetic, calm, and editorial. Other accepts one custom phrase up to 80 characters.

## 10. Step 5 — Budget & Timing

The page states:

> This helps me recommend an appropriate scope. It is not an estimate, quote, or commitment.

### Website, redesign, online-store, and not-sure paths

- Under $500
- $500–$1,000
- $1,000–$2,500
- $2,500–$5,000
- More than $5,000
- Not sure yet

### Custom digital tool path

- Under $1,000
- $1,000–$2,500
- $2,500–$5,000
- $5,000–$10,000
- More than $10,000
- Not sure yet

### Ongoing support path

**One-time support**

- Under $250
- $250–$500
- $500–$1,000
- More than $1,000
- Not sure yet

**Recurring support — monthly range**

- Under $100 per month
- $100–$250 per month
- $250–$500 per month
- More than $500 per month
- Not sure yet

### Timing and readiness

- Preferred timing: as soon as reasonably possible, within one month, 1–3 months, 3–6 months, flexible, not sure
- Desired launch date — optional unless marked fixed
- Fixed or flexible date
- Related event, opening, promotion, season, or deadline — maximum 1,000 characters
- Readiness: ready to begin, preparing materials, comparing options, early research, not sure
- Final decision maker: client, shared decision, someone else
- Other approvers — maximum 500 characters

## 11. Step 6 — Review & Contact

### Contact preferences

- Preferred method: email, phone, text, Instagram, Facebook
- Best days or times to respond — optional, maximum 500 characters
- Time zone — requested when a preferred time is supplied
- Additional information for Evan — optional, maximum 2,000 characters
- How the client heard about Calypso Digital Studio — optional

Phone or text requires a valid phone number.

Instagram or Facebook requires an account name or profile URL unless a usable account was supplied earlier.

### Review summary

The client sees six sections:

- Business
- Project type and add-ons
- Goals, pages, and functionality
- Branding and materials
- Budget and timing
- Contact details

Each section has an **Edit** action returning directly to its step without losing answers.

### Required confirmations

The client confirms:

- the information is accurate to the best of their knowledge;
- submission does not commit them to purchasing services; and
- Calypso Digital Studio may use the information to evaluate and respond to the request.

There is no marketing-consent checkbox and no automatic mailing-list enrollment.

## 12. Confirmation screen

After the owner notification is accepted, show:

> **Your project details have been received.**
>
> I’ll personally review the information and contact you within 2–3 business days. No price has been generated, and you are not committed to purchasing anything. A copy of your submission has been sent to your email.

The screen includes:

- stable reference number;
- client email;
- 2–3 business-day response expectation;
- `calydigital@outlook.com`;
- link back to the website; and
- action to begin a separate request.

When the owner email succeeds but the client copy fails, replace the final sentence with:

> Your project was received, but the email copy could not be confirmed. Keep this reference number and contact me at `calydigital@outlook.com` if you need a copy.

A completed submission is never restored as a draft.

## 13. Conditional rules

A single conditions module controls visibility, required fields, and payload cleanup.

- Store fields: Online Store primary type or Product Sales add-on
- Redesign fields: Website Redesign primary type only
- Support fields: Ongoing Support primary type only
- Custom-tool fields: Custom Digital Tool primary type only
- Booking fields: Booking add-on
- Standalone payment fields: Online Payments add-on when store checkout does not already cover payment
- Phone required: preferred contact is phone or text
- Social account required: preferred contact is Instagram or Facebook and none is already available
- Launch date required: date is marked fixed
- Other explanation required: an Other option is selected

The server repeats all conditional validation. Hiding a browser field never bypasses server rules.

## 14. Component architecture

The static Astro site remains the foundation. The form uses focused components and vanilla TypeScript rather than adding a UI framework solely for this wizard.

```text
src/pages/start.astro
src/components/intake/IntakeWizard.astro
src/components/intake/WizardProgress.astro
src/components/intake/WizardNavigation.astro
src/components/intake/RestoreDraftNotice.astro
src/components/intake/ReviewSummary.astro
src/components/intake/SubmissionConfirmation.astro
src/components/intake/steps/BusinessStep.astro
src/components/intake/steps/ProjectStep.astro
src/components/intake/steps/NeedsStep.astro
src/components/intake/steps/MaterialsStep.astro
src/components/intake/steps/BudgetStep.astro
src/components/intake/steps/ReviewStep.astro
src/data/intake.ts
src/lib/intake/types.ts
src/lib/intake/schema.ts
src/lib/intake/conditions.ts
src/lib/intake/storage.ts
src/scripts/intake-wizard.ts
functions/api/intake.ts
```

Responsibilities:

- `start.astro`: metadata, introduction, no-script fallback, wizard container
- step components: semantic fields and plain-language help
- `intake.ts`: labels, options, and descriptions shared by UI and email formatting
- `types.ts`: submission model
- `schema.ts`: field limits, normalization, and validation
- `conditions.ts`: branch visibility, requirements, and irrelevant-data cleanup
- `storage.ts`: versioned local draft handling
- `intake-wizard.ts`: state, navigation, errors, history, and submission
- `functions/api/intake.ts`: request validation, Turnstile verification, email delivery, and safe responses

No single file may own all fields, conditional rules, state, email formatting, and endpoint behavior.

## 15. Submission data model

Top-level shape:

```text
version
submissionId
startedAt
business
project
needs
materials
budgetAndTiming
contact
consent
turnstileToken
honeypot
```

`turnstileToken` and `honeypot` exist only in the submission request. They are never stored in the local draft or included in emails.

The display reference is derived deterministically from the UUID as `CDS-` plus the first ten hexadecimal UUID characters in uppercase, for example `CDS-A1B2C3D4E5`. The same submission UUID always produces the same reference during retries.

## 16. Draft storage

Browser key:

```text
calypso:intake:v1
```

Stored values:

- schema version;
- submission UUID;
- form answers;
- current step;
- started timestamp; and
- updated timestamp.

Not stored:

- Turnstile token;
- honeypot value;
- secrets;
- email status; or
- completed submission data.

Rules:

- Save 500 milliseconds after the last field change.
- Save immediately on step navigation.
- Expire drafts 30 days after the last update.
- Delete expired drafts automatically.
- Clear after confirmed owner-email acceptance.
- Clear after confirmed Start Over.
- When local storage fails, allow completion but remove the Saved on This Device claim.

## 17. Validation and normalization

Validation occurs:

1. before leaving each step;
2. before final submission; and
3. again in the Pages Function.

Exact limits:

- Request body: maximum 100 KB
- Name, business name, location, platform: 120 characters each
- Email: 254 characters
- Phone input: 32 characters and 7–15 digits after formatting characters are removed
- URL: 500 characters, HTTP or HTTPS only after normalization
- Social links: maximum five
- Liked example sites: maximum three
- Disliked example sites: maximum three
- Custom visual phrase: 80 characters
- Short Other fields: 500 characters unless a smaller limit is stated
- Standard explanatory text areas: 2,000 characters
- Detailed custom-tool process fields: 3,000 characters where stated
- Array selections: only documented values; duplicate values removed

URL normalization may prepend `https://` when the visitor pastes a normal domain without a scheme. Other schemes are rejected.

User content is escaped before HTML email rendering. Unknown object keys are rejected. Irrelevant hidden branch data is removed before email formatting.

When a step fails validation:

- show errors beside fields;
- show a linked error summary at the top;
- move focus to the summary; and
- preserve every answer.

## 18. Submission architecture

The browser sends JSON to:

```text
POST /api/intake
```

The route is a Cloudflare Pages Function at `functions/api/intake.ts`.

Flow:

1. Browser validates the completed wizard.
2. Review step obtains a fresh Turnstile token.
3. Browser sends normalized answers, UUID, Turnstile token, and honeypot.
4. Function checks POST method, JSON content type, 100 KB limit, expected origin, empty honeypot, schema, and conditional rules.
5. Function validates Turnstile server-side.
6. Function derives the stable `CDS-XXXXXXXXXX` reference.
7. Function sends the owner notification.
8. After owner acceptance, Function sends the client confirmation.
9. Function returns reference and confirmation status.
10. Browser clears the draft and shows the appropriate confirmation state.

The client request times out after 20 seconds. A timeout preserves the draft and permits retry. Stable idempotency keys prevent duplicate accepted emails if the first response was lost.

Deployment configuration:

```text
RESEND_API_KEY
INTAKE_FROM_EMAIL
INTAKE_TO_EMAIL=calydigital@outlook.com
TURNSTILE_SECRET_KEY
PUBLIC_TURNSTILE_SITE_KEY
```

Secrets are never committed or exposed to browser code. `INTAKE_FROM_EMAIL` must be an authorized sender for the configured email provider. The Outlook address remains the destination and public reply contact; it is not falsely presented as an authenticated sender through an unrelated domain.

## 19. Spam and abuse protection

Use:

- Cloudflare Turnstile on the final step;
- mandatory server-side token validation;
- hidden honeypot;
- expected-origin check;
- JSON-only request handling;
- 100 KB request limit;
- allowlisted fields and option values; and
- server-controlled recipient, sender, and subjects.

Turnstile is initialized or refreshed on the review step so a token is not created near the beginning of a long form session.

A Turnstile error resets verification, preserves every answer, and asks the visitor to complete the security check again.

## 20. Email behavior

### Owner notification

Recipient: `calydigital@outlook.com`

Subject:

```text
New project inquiry — [Business Name] — [Primary Project Type] — [Reference]
```

Contents:

- reference and submission time;
- client contact details and preferred method;
- business summary;
- primary project and add-ons;
- all applicable conditional answers;
- materials;
- budget and timing;
- referral source;
- supplied links; and
- Reply-To set to the client's email.

### Client confirmation

Subject:

```text
We received your Calypso Digital Studio project details — [Reference]
```

Contents:

- receipt confirmation;
- 2–3 business-day expectation;
- no generated quote;
- no purchase commitment;
- organized answer summary;
- reference; and
- `calydigital@outlook.com` for corrections.

Both emails have HTML and plain-text versions.

### Idempotency and failure order

Use stable provider idempotency keys:

```text
intake-owner-[submission UUID]
intake-client-[submission UUID]
```

Each email receives one automatic retry using the same idempotency key.

- Owner email failure after retry: submission is incomplete; remain on Review with preserved data and Retry.
- Owner success and client failure after retry: submission is received; show partial-success confirmation and reference.
- Retrying a timed-out request must not create a duplicate owner email.

## 21. Error handling

### Network or timeout

> Your answers are still saved on this device, but the submission could not be confirmed. Check your connection and try again.

### Turnstile failure

> The security check could not be confirmed. Complete the refreshed check and submit again. Your answers have not been lost.

### Server or owner-email failure

> Your answers are still saved, but I could not confirm delivery. Try again in a moment or email `calydigital@outlook.com` and include your project reference.

The endpoint returns public error codes only. It never returns provider responses, stack traces, payload contents, or secrets.

The Submit button is disabled only while a request is active and becomes available after every recoverable error.

## 22. Accessibility

- Native `form`, `fieldset`, `legend`, `label`, `input`, `select`, and `textarea`
- Visible label for every field
- Required status communicated in text, not color alone
- Help and errors connected through `aria-describedby`
- Step heading focused after intentional navigation
- Error summary focused after failed validation
- Screen-reader-friendly progress text
- Predictable Back and Continue order
- Complete keyboard operation
- Visible focus indicators
- Comfortable phone touch targets
- Minimal motion respecting `prefers-reduced-motion`
- Conditional sections announced without excessive live-region output
- Turnstile not used as the only indication of readiness

## 23. Responsive design

### Mobile: 390px and 430px

- One field group per row
- Full-width controls
- Sticky bottom navigation only when it does not cover content
- Compact progress bar and current step name
- Stacked review cards
- Safe wrapping for URLs and emails
- No horizontal scrolling

### Desktop: 1440px

- Centered readable form column
- Related short fields may share a row
- All six progress labels may be visible
- Review may use two columns while preserving reading order
- Text inputs never stretch across the full viewport

## 24. No-JavaScript fallback

When scripting is unavailable, show:

- the information to include in a manual inquiry;
- `calydigital@outlook.com` as primary contact;
- Instagram and Facebook alternatives; and
- a clear statement that the guided form requires browser scripting.

The page must not appear empty or broken.

## 25. Privacy and data handling

- Collect only information needed to evaluate and answer a project request.
- Never ask for passwords, payment data, government identifiers, or confidential customer records.
- Never place answers in URLs.
- Never log full production request bodies.
- Never send field contents to analytics.
- Store drafts only in the visitor's browser for 30 days.
- Clear drafts after confirmed owner-email acceptance.
- Send submitted data only through the configured email provider to Evan's business inbox and the client's confirmation address.
- Show a plain-language data-use statement before submission.
- Do not enroll clients in marketing messages.

## 26. Testing

### Unit tests

- Valid and invalid shared-schema cases
- Every primary-type branch
- Every add-on branch
- Conditional required fields
- Irrelevant-data cleanup
- Budget-path selection
- 30-day draft expiration
- Storage failure behavior
- Stable references
- Stable idempotency keys

### Function tests with mocked providers

- Accepted submission
- Wrong method or content type
- Request over 100 KB
- Honeypot submission
- Invalid Turnstile token
- Expired or duplicate Turnstile token
- Invalid conditional fields
- Owner email failure
- Client email partial failure
- Timeout retry without duplication

CI must never send a real email.

### Browser tests

- Complete all six primary paths
- Complete meaningful add-on combinations
- Back and Continue without data loss
- Browser Back and Forward
- Block direct navigation to incomplete future steps
- Restore draft
- Discard draft
- Edit each review section
- Field-error focus and links
- Network retry
- Turnstile retry
- Clear draft after owner success

### Accessibility and visual checks

- Keyboard-only completion
- Label, help, and error relationships
- Automated accessibility scan for each step
- Visible focus
- Reduced motion
- 390px, 430px, and 1440px screenshots
- No horizontal overflow
- Long-content stress test

## 27. Deployment requirements

Before enabling public submission:

- deploy the Pages Function route;
- configure all secrets and environment values;
- verify the email sender identity;
- configure a production Turnstile widget for the live hostname;
- use official Turnstile test credentials in automated tests;
- verify HTML and plain-text emails;
- submit a controlled request on the deployed site;
- confirm owner delivery to `calydigital@outlook.com`;
- confirm client-copy delivery;
- confirm timeout retry does not duplicate email; and
- confirm failed submissions retain draft data.

The public form remains disabled or clearly unavailable until endpoint, Turnstile, and email delivery are all verified.

## 28. Acceptance checklist

Implementation is ready for review only when:

- the placeholder cards are replaced by the working wizard;
- all six steps are complete;
- conditional paths match this specification;
- no price is generated;
- no uploads, accounts, payments, or dashboard are added;
- drafts survive refresh and accidental closure on the same device;
- review Edit actions work;
- owner email is structured and complete;
- client confirmation includes their summary;
- the 2–3 business-day expectation is consistent;
- server-side Turnstile validation is active;
- failures preserve answers;
- responsive and accessibility checks pass;
- tests and production build pass; and
- no secret or real client submission is committed.
