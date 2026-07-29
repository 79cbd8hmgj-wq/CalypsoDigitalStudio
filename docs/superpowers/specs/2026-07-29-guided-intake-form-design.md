# Calypso Digital Studio Guided Intake Form Design

**Date:** 2026-07-29  
**Status:** Approved design, awaiting written-spec review  
**Owner:** Evan Lebrecht / Calypso Digital Studio

## 1. Purpose

Replace the current informational Start Your Project placeholder with a complete, step-by-step client intake form.

The form must help a prospective client describe their business and project without needing web-development or software terminology. It must collect enough organized information for Evan to review the request personally and prepare a custom recommendation and quote.

The form must not calculate, display, imply, or guarantee a price.

## 2. Success criteria

The finished form is successful when it:

- works as a real submission form rather than a list of future features;
- is comfortable to complete on a phone;
- explains unfamiliar options in plain business language;
- asks only questions relevant to the selected project;
- supports one primary project type plus optional add-ons;
- saves unfinished progress on the visitor's current device;
- provides a final review screen before submission;
- sends an organized project summary to `calydigital@outlook.com`;
- sends the client an automatic confirmation and copy of their answers;
- promises a personal response within 2–3 business days;
- protects the endpoint from automated spam;
- preserves all answers when validation, network, or email delivery fails; and
- remains visually consistent with the existing Warm Creative Workshop design system.

## 3. Product decisions

### Included

- Six-step guided wizard
- One primary project type
- Optional add-ons
- Conditional questions
- Browser-based progress recovery
- Review and edit screen
- Server-side validation
- Cloudflare Turnstile protection
- Business notification email
- Client confirmation email
- Submission reference number
- Accessible error handling and keyboard navigation
- Plain-language data-use notice

### Excluded from the first release

- Accounts or logins
- File uploads
- Public pricing estimates
- Automatic quotes
- Payments or deposits
- Appointment scheduling
- A client portal
- A private administrative dashboard
- Cross-device draft syncing
- Permanent database storage
- Marketing-email enrollment

The first release deliberately uses email as the business record. A database or project dashboard should only be added later if submission volume makes it useful.

## 4. Overall experience

The Start Your Project page will open with a short explanation before the first step.

The introduction will communicate:

- the form takes approximately 5–10 minutes;
- the visitor does not need to know technical terminology;
- no price will be generated;
- submitting does not commit them to purchasing services;
- unfinished progress is saved on the current device;
- files are not needed at this stage; and
- Evan will personally review the submission within 2–3 business days.

The main action is **Start Your Project**.

When an unfinished draft is found, the page shows a clear choice:

- **Continue saved project**
- **Start over**

Starting over requires confirmation before saved answers are deleted.

## 5. Step structure

The progress indicator uses six named steps:

1. Your Business
2. Project Type
3. Project Needs
4. Branding & Materials
5. Budget & Timing
6. Review & Contact

The confirmation screen appears after submission and is not counted as a form step.

Each step shows:

- the step name;
- `Step X of 6`;
- a short explanation of why the information is useful;
- only the fields relevant to that step;
- **Back** and **Continue** controls; and
- a subtle `Saved on this device` status after local progress is written.

The final step replaces **Continue** with **Submit Project Details**.

## 6. Step 1 — Your Business

### Purpose

Understand the client, the business, and the audience before discussing pages or software features.

### Fields

| Field | Requirement | Notes |
| --- | --- | --- |
| Full name | Required | Person Evan will contact |
| Business or project name | Required | May be `Not decided yet` for a new business |
| Email address | Required | Used for confirmation and follow-up |
| Phone number | Optional initially | Becomes required if phone or text is selected later |
| Where is the business based? | Required | Includes `Online only / not location-specific` |
| Service area | Required | Local, regional, nationwide, online, or combination |
| Existing website | Optional | URL validation; required later for redesign/support when not already supplied |
| Social media links | Optional | Accept multiple links without requiring a platform |
| What does the business offer? | Required | Prompt includes a short example |
| Who are the main customers? | Required | Prompt asks who they serve rather than asking for a formal persona |
| What makes the business different? | Optional but encouraged | Allows `Still figuring this out` |

Broad questions include examples beneath the label. Examples help the client answer but are never prefilled as their response.

## 7. Step 2 — Project Type

### Primary project type

The client selects exactly one:

- **New business website** — build a professional website from the beginning.
- **Website redesign** — replace, reorganize, or improve an existing website.
- **Online store** — sell products, accept payment, and manage customer purchasing steps.
- **Custom digital tool** — improve a repeated business process with purpose-built software.
- **Ongoing website support** — fix, improve, or maintain an existing website.
- **Not sure yet** — describe the problem and receive a recommendation.

Only one primary type may be active at a time.

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

Selecting an add-on may reveal a small number of related questions in Step 3.

### Changing the primary type

When the client changes the primary project type after answering conditional questions, the form explains that incompatible answers will be removed. The change proceeds only after confirmation.

Removing an add-on clears only the answers that belong exclusively to that add-on.

## 8. Step 3 — Project Needs

### Shared goals

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

The remaining fields depend on the primary project type and add-ons.

### 8.1 New website path

The client selects expected pages:

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

The client selects expected functionality:

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
- Multiple business locations
- Other
- Not sure yet

The client is not required to determine the final page count. The form explicitly says Evan will recommend the clearest structure after review.

### 8.2 Website redesign path

In addition to the standard website questions:

- Current website address — required if not supplied in Step 1
- Current platform — optional, with `I do not know`
- What currently works well?
- What needs to change most?
- Should existing written content be reused, rewritten, or reviewed first?
- Should existing photos or media be reused?
- Does information need to be moved from the current website?
- Is anything currently broken or preventing customers from taking action?

### 8.3 Online store path

Store questions appear when the primary type is Online Store or the Product Sales add-on is selected.

- Approximate product count: 1–10, 11–25, 26–50, 51–100, more than 100, not sure
- Approximate number of product categories
- Product type: physical, digital, made-to-order, service-based, or combination
- Variations such as size, color, flavor, package, or personalization
- Shipping required
- Local delivery required
- Local pickup required
- Inventory tracking required
- Discount codes or promotions required
- Custom orders or customer notes required
- Taxes currently understood, need guidance, or not sure
- Existing payment provider, when applicable
- Existing product descriptions and photos available or still needed
- Existing store or product catalog that needs migration

The form does not provide tax, legal, shipping, or payment-processing advice. It only records the client's current needs and level of readiness.

### 8.4 Custom digital tool path

This path avoids software architecture terminology and focuses on the real business process.

- What task or process should the tool improve?
- How is the work handled now?
- Who needs to use the tool?
- What information goes into the process?
- What should the tool produce, calculate, organize, or help complete?
- Are different access levels needed for owners, staff, or customers?
- Should it send reminders, updates, or notifications?
- Are reports, printable summaries, or downloadable files needed?
- Will it mainly be used on phones, computers, tablets, or a combination?
- Does it need to work with software the business already uses?
- What is the biggest problem with the current process?
- What would a successful result look like in everyday use?

The client is not asked to choose a programming language, database, framework, API, hosting platform, or other technical implementation detail.

### 8.5 Ongoing support path

- Current website address — required if not supplied in Step 1
- Current platform — optional, with `I do not know`
- Help needed: content updates, visual changes, broken feature, performance, mobile layout, maintenance, security concern, new feature, other
- One-time help or continuing support
- Urgency: normal, time-sensitive, website partly unusable, website unavailable
- What is happening now?
- What result is needed?
- Does the client have access to the domain, hosting, and website account?

The form will not promise emergency availability. Urgent selections help Evan understand priority during review.

### 8.6 Not sure yet path

This path remains short and reassuring:

- What would the client like the business to do better online?
- What problem is happening now?
- What would they like customers or staff to be able to do?
- Does a website already exist?
- Which outcomes matter most?

Evan uses these answers to recommend the appropriate project type.

### 8.7 Add-on questions

Additional questions appear only when needed:

**Booking or appointment requests**

- Request-only or immediate confirmed booking
- Types of appointments or services
- Existing calendar or booking service
- Deposits required or not sure

**Online payments without product sales**

- Purpose: deposits, invoices, service payments, donations, memberships, other
- Existing payment provider

**Custom forms**

- Who completes the form
- What information it should collect
- What should happen after submission

**Website maintenance**

- One-time cleanup or recurring help
- Expected update frequency

**Something else**

- Plain-text description with an example prompt

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

Selecting `None of these yet` clears other material selections after confirmation.

The form explains that no files are required now. Evan will request the necessary materials after reviewing the submission.

### Visual direction

- Choose up to three words that should describe the finished website or tool
- Existing brand elements that must remain
- Colors, styles, or visual approaches to avoid
- Websites the client likes — optional links
- What they like about those examples
- Websites they dislike — optional links
- What they dislike about those examples

Suggested descriptive words include warm, bold, modern, playful, elegant, minimal, professional, earthy, luxurious, energetic, calm, and editorial. An Other option accepts the client's own wording.

## 10. Step 5 — Budget & Timing

The budget question gathers planning context. It does not produce or imply a quote.

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

The label changes according to one-time or recurring support.

**One-time support**

- Under $250
- $250–$500
- $500–$1,000
- More than $1,000
- Not sure yet

**Recurring support — approximate monthly range**

- Under $100 per month
- $100–$250 per month
- $250–$500 per month
- More than $500 per month
- Not sure yet

### Timing fields

- Preferred timing: as soon as reasonably possible, within one month, 1–3 months, 3–6 months, flexible, not sure
- Desired launch date — optional unless the client says the date is fixed
- Fixed or flexible date
- Event, opening, promotion, seasonal need, or other deadline connected to the date
- Readiness: ready to begin, preparing materials, comparing options, early research, not sure
- Final decision maker: client, shared decision, someone else
- Other people involved in approval

A note beside the budget field states:

> This helps me recommend an appropriate scope. It is not an estimate, quote, or commitment.

## 11. Step 6 — Review & Contact

### Contact preferences

- Preferred contact method: email, phone, text, Instagram, Facebook
- Best days or times to respond — optional
- Anything else Evan should understand — optional
- How the client heard about Calypso Digital Studio — optional

If phone or text is selected, a valid phone number becomes required.

If Instagram or Facebook is selected, the client provides the account name or profile link unless one was already supplied.

### Review summary

The client sees a readable summary divided into:

- Business
- Project type and add-ons
- Goals, pages, and functionality
- Branding and available materials
- Budget and timing
- Contact details

Each section has an **Edit** action that returns directly to the relevant step without losing answers.

### Required confirmations

Before submission, the client confirms:

- the information is accurate to the best of their knowledge;
- submission does not commit them to purchasing services; and
- Calypso Digital Studio may use the submitted information to evaluate and respond to the project request.

There is no marketing-consent checkbox and no automatic mailing-list enrollment.

## 12. Confirmation screen

After the server confirms that the business notification was accepted, the form is replaced by a confirmation panel.

Primary message:

> **Your project details have been received.**
>
> I’ll personally review the information and contact you within 2–3 business days. No price has been generated, and you are not committed to purchasing anything. A copy of your submission has been sent to your email.

The confirmation includes:

- submission reference number;
- client email address;
- expected response time;
- `calydigital@outlook.com`;
- a link back to the website; and
- a button to begin a different project request.

A new request receives a new submission identifier and does not restore the completed form.

## 13. Conditional behavior rules

Conditional questions are controlled by explicit, testable rules rather than scattered display checks.

Examples:

- Store questions show when `primaryType = online-store` or `addOns` contains `product-sales`.
- Redesign questions show only when `primaryType = website-redesign`.
- Support questions show only when `primaryType = ongoing-support`.
- Custom-tool questions show only when `primaryType = custom-tool`.
- Booking questions show when `addOns` contains `booking`.
- Payment questions show when `addOns` contains `online-payments` and store checkout questions do not already cover the same need.
- Phone becomes required when preferred contact is phone or text.
- Social handle becomes required when preferred contact is Instagram or Facebook and no usable account link is already present.
- Fixed launch date becomes required when the client marks the date as fixed.

The server repeats all conditional validation. Hiding a field in the browser never bypasses server requirements.

## 14. Component architecture

The existing static Astro site remains the foundation. The form adds focused components rather than placing the entire wizard in `start.astro`.

Recommended structure:

```text
src/pages/start.astro
src/components/intake/IntakeWizard.astro
src/components/intake/WizardProgress.astro
src/components/intake/WizardNavigation.astro
src/components/intake/RestoreDraftNotice.astro
src/components/intake/steps/BusinessStep.astro
src/components/intake/steps/ProjectStep.astro
src/components/intake/steps/NeedsStep.astro
src/components/intake/steps/MaterialsStep.astro
src/components/intake/steps/BudgetStep.astro
src/components/intake/steps/ReviewStep.astro
src/components/intake/ReviewSummary.astro
src/components/intake/SubmissionConfirmation.astro
src/data/intake.ts
src/lib/intake/types.ts
src/lib/intake/schema.ts
src/lib/intake/conditions.ts
src/lib/intake/storage.ts
src/scripts/intake-wizard.ts
functions/api/intake.ts
```

### Responsibilities

- `start.astro` provides page metadata, introduction, direct-contact fallback, and the wizard container.
- Step components render semantic fields and plain-language help.
- `intake.ts` contains option labels and descriptions shared by the interface and email formatting.
- `types.ts` defines the submission shape.
- `schema.ts` defines shared field limits, required fields, and normalization rules.
- `conditions.ts` is the single source of truth for branch visibility and conditional requirements.
- `storage.ts` handles versioned local draft persistence.
- `intake-wizard.ts` manages navigation, state, validation display, history, and submission.
- `functions/api/intake.ts` validates the request, checks Turnstile, formats emails, and returns a safe response.

No single component should contain every field, every condition, email formatting, and submission logic.

## 15. Client-side state and progress recovery

### Draft storage

Drafts use a versioned browser key:

```text
calypso:intake:v1
```

The stored draft includes:

- schema version;
- submission UUID;
- form answers;
- current step;
- creation timestamp; and
- last-updated timestamp.

It does not include:

- Turnstile tokens;
- server secrets;
- email-delivery status; or
- any data from a completed submission.

### Saving behavior

- Changes are saved after a short debounce.
- Navigation between steps forces an immediate save.
- Drafts expire after 30 days.
- Expired drafts are deleted automatically.
- Successful submission clears the draft.
- Starting over clears the draft after confirmation.
- A storage failure does not block form completion; the page quietly stops claiming that progress is saved.

### Navigation history

The active step is reflected in the URL hash using stable names such as `#business`, `#project`, and `#review`.

Browser Back and Forward move between completed form steps without losing state. The wizard does not trap the visitor on the page.

## 16. Validation and field limits

Validation occurs at three levels:

1. while leaving a step;
2. before final submission; and
3. again inside the Pages Function.

Requirements:

- Email addresses use normal email validation without rejecting valid uncommon domains.
- URLs accept `https://`, `http://`, and common pasted domain formats, then normalize them safely.
- Phone validation is permissive enough for formatting characters but requires a usable number of digits.
- Text fields have explicit maximum lengths.
- Large text areas have limits sufficient for useful explanations without allowing oversized requests.
- Multi-select fields enforce allowed values.
- Unknown object keys are discarded or rejected server-side.
- Hidden irrelevant branch data is removed from the normalized server payload.
- User text is escaped before being inserted into HTML email.
- The browser never determines recipients, sender identity, or email subject lines.

When a step fails validation, focus moves to the step's error summary, which links to each invalid field. Previously entered answers remain unchanged.

## 17. Submission architecture

### Endpoint

The browser submits JSON to:

```text
POST /api/intake
```

The route is implemented as a Cloudflare Pages Function at `functions/api/intake.ts`.

### Request flow

1. The browser validates the visible form state.
2. The final step obtains a Turnstile token.
3. The browser sends the normalized draft, submission UUID, and Turnstile token to `/api/intake`.
4. The Function checks method, content type, request size, origin, honeypot, and schema.
5. The Function validates the Turnstile token server-side.
6. The Function creates a stable public reference such as `CDS-20260729-A1B2C3`.
7. The Function sends the owner notification email.
8. After owner delivery is accepted, the Function sends the client confirmation email.
9. The Function returns the reference number and confirmation status.
10. The browser clears the draft and displays confirmation.

### Secrets and configuration

The following values are deployment secrets or environment variables and are never committed:

```text
RESEND_API_KEY
INTAKE_FROM_EMAIL
INTAKE_TO_EMAIL=calydigital@outlook.com
TURNSTILE_SECRET_KEY
PUBLIC_TURNSTILE_SITE_KEY
```

`INTAKE_FROM_EMAIL` must be a sender authorized by the configured email provider. The implementation must not pretend the Outlook address can be used as an authenticated sender through a different domain. `calydigital@outlook.com` remains the destination and reply contact.

## 18. Spam and abuse protection

The first release uses layered protection:

- Cloudflare Turnstile on the final step;
- mandatory server-side Turnstile verification;
- a visually hidden honeypot field;
- same-origin request checks;
- content-type and request-size enforcement;
- strict field allowlists and length limits; and
- no client-controlled recipient fields.

Turnstile is initialized or refreshed when the visitor reaches the review step so the token is not generated too early and allowed to expire during a long form session.

The form must remain usable when Turnstile reports an error. It resets the challenge, preserves all answers, and explains that verification must be completed again.

## 19. Email behavior

### Owner notification

Recipient: `calydigital@outlook.com`

Suggested subject:

```text
New project inquiry — [Business Name] — [Primary Project Type] — [Reference]
```

The email includes:

- reference number;
- submission date and time;
- client contact information;
- preferred contact method;
- business summary;
- primary project and add-ons;
- all applicable branch answers;
- available materials;
- budget and timeline;
- referral source;
- direct links supplied by the client; and
- a clear Reply-To using the client's email address.

### Client confirmation

Suggested subject:

```text
We received your Calypso Digital Studio project details — [Reference]
```

The email includes:

- confirmation that the submission was received;
- the 2–3 business-day response expectation;
- a statement that no quote was generated;
- a statement that submission is not a purchase commitment;
- their organized submission summary;
- the reference number; and
- `calydigital@outlook.com` for corrections or questions.

Both emails include HTML and plain-text versions.

### Duplicate protection

The submission UUID is used to create stable email idempotency keys. Retrying the same accepted submission must not create duplicate owner notifications.

### Partial email failure

- If the owner notification fails, the submission is not considered complete. The client remains on the review step with all answers preserved and a retry option.
- If the owner notification succeeds but the client copy fails after retry, the submission is considered received. The confirmation screen states that the project was received but the email copy may be delayed, and gives the reference number and business email.

## 20. Error handling

### Field errors

- Display next to the affected field.
- Also summarize at the top of the current step.
- Preserve every valid answer.
- Move focus to the error summary.

### Network failure

Message:

> Your answers are still saved on this device, but the submission could not be sent. Check your connection and try again.

The Submit button becomes available again without reloading.

### Verification failure

Message:

> The security check could not be confirmed. Complete the refreshed check and submit again. Your answers have not been lost.

### Server or email failure

Message:

> Your answers are still saved, but I could not confirm delivery. Try again in a moment or email `calydigital@outlook.com` and include your project reference.

The endpoint returns safe public error codes rather than provider responses, stack traces, or secret details.

## 21. Accessibility requirements

- Use native `form`, `fieldset`, `legend`, `label`, `input`, `select`, and `textarea` elements.
- Every field has a visible label.
- Required status is communicated in text, not by color alone.
- Help text and errors are connected using `aria-describedby`.
- Step headings receive focus after intentional step navigation.
- Error summaries receive focus after failed validation.
- Progress is understandable to screen readers without reading decorative steps.
- Back and Continue controls remain in a predictable order.
- Keyboard users can complete every option and edit the review summary.
- Focus indicators follow the site's existing visible-focus standard.
- Touch targets are at least comfortably usable on phones.
- Motion is minimal and respects `prefers-reduced-motion`.
- Conditional content is announced when it appears without producing excessive screen-reader chatter.
- Turnstile is not the only visible indication of submission readiness.

## 22. Responsive design

### Mobile

Primary design targets: 390px and 430px widths.

- One field group per row
- Full-width inputs and action buttons
- Sticky bottom navigation when it does not cover content
- Compact progress bar with current step name
- Review sections displayed as stacked cards
- Long URLs and email addresses wrap safely
- No horizontal scrolling

### Desktop

Primary verification target: 1440px width.

- Form content remains in a readable centered column
- Related short fields may share a row
- Progress may show all six step names
- Review summary may use a two-column arrangement where reading order remains correct
- The form must not stretch text fields across the full viewport

## 23. No-JavaScript fallback

The guided behavior requires JavaScript. When scripts are unavailable, the page still displays:

- what information to include in an inquiry;
- `calydigital@outlook.com` as the primary contact;
- Instagram and Facebook alternatives; and
- a clear explanation that the guided form requires browser scripting.

The page must not appear empty or broken.

## 24. Privacy and data handling

- Collect only information needed to evaluate and respond to a project.
- Do not request passwords, payment information, government identifiers, or confidential customer records.
- Do not include form answers in URLs.
- Do not log full request bodies in production.
- Do not send field contents to analytics services.
- Store unfinished drafts only in the visitor's browser for up to 30 days.
- Clear the local draft after confirmed submission.
- Send submitted information only to the configured email provider and Evan's business inbox.
- Include a plain-language data-use statement before submission.
- Do not enroll the client in marketing messages.

## 25. Testing requirements

### Unit tests

- Shared schema accepts valid submissions and rejects invalid data.
- Every primary project type activates the correct branch.
- Every add-on activates only its related fields.
- Conditional required fields behave correctly.
- Incompatible hidden data is removed from normalized payloads.
- Budget options match the selected path.
- Draft expiration and version migration behave correctly.
- Submission references and idempotency keys are stable.

### Function tests

Use mocked Turnstile and email responses.

Cover:

- accepted submission;
- invalid content type;
- oversized request;
- honeypot activation;
- invalid Turnstile token;
- expired or duplicate Turnstile token;
- invalid conditional fields;
- owner email failure;
- client email partial failure; and
- duplicate retry behavior.

CI must never send a real email.

### Browser tests

- Complete all six primary project paths.
- Complete add-on combinations.
- Move backward and forward without losing answers.
- Restore a saved draft.
- discard a saved draft;
- edit each review section;
- handle validation errors;
- retry after simulated network failure;
- clear draft after success; and
- verify browser Back and Forward step navigation.

### Accessibility and visual verification

- Keyboard-only completion
- Screen-reader-friendly labels and error relationships
- Automated accessibility scan of each step
- Visible focus checks
- Reduced-motion check
- 390px, 430px, and 1440px screenshots
- No horizontal overflow
- Long names, URLs, and descriptions do not break layout

## 26. Deployment requirements

Before production submission is enabled:

- configure the Pages Function route;
- add the required environment variables and secrets;
- verify the email sender identity;
- configure a production Turnstile widget for the live hostname;
- use Turnstile test credentials in automated testing;
- verify both HTML and plain-text email output;
- submit a real controlled test from the deployed site;
- confirm arrival at `calydigital@outlook.com`;
- confirm the client-copy email; and
- verify that failed submissions retain browser progress.

The public form must remain disabled or clearly marked as unavailable until the deployed endpoint, spam verification, and email delivery are all confirmed.

## 27. Acceptance checklist

The implementation is ready for review only when:

- the placeholder project-type cards have been replaced by the working wizard;
- all six steps are present;
- conditional paths match this specification;
- no price is generated;
- no uploads or accounts are introduced;
- progress survives refresh and accidental closure on the same device;
- review and Edit actions work;
- the owner email is structured and complete;
- the client receives a confirmation summary;
- the 2–3 business-day expectation is shown consistently;
- server-side Turnstile validation is active;
- failures preserve all answers;
- accessibility and responsive checks pass;
- tests and production build pass; and
- no secret or real client submission is committed to the repository.
