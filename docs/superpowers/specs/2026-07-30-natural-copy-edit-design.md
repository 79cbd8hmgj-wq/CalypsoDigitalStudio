# Natural Copy Editing Pass Design

## Purpose

Calypso Digital Studio’s public copy currently relies too often on em dashes, slash-separated phrases, repeated sentence patterns, and formal wording that can feel machine written. This pass will make the site read more naturally without changing the business positioning, services, page structure, form behavior, or factual promises.

This is a light consistency edit rather than a full rewrite.

## Goals

The finished site should:

- sound professional, natural, and direct;
- use straightforward sentences with limited marketing language;
- speak consistently as Calypso Digital Studio or the studio;
- keep Evan’s personal biography in first person;
- avoid unnecessary em dashes and slash-heavy shorthand;
- preserve useful hyphenated compounds such as one-time, follow-up, small-business, and purpose-built;
- retain the current meaning, services, facts, calls to action, and response expectations.

## Voice

### Studio-facing copy

Public business copy will use “Calypso Digital Studio” or “the studio.” It will not use “we,” because the wording should not imply a larger team.

Studio-facing copy will also avoid unnecessary first-person statements such as:

- “I’ll personally review…”
- “I build…”
- “Tell me…”

These will be revised into natural studio-language equivalents, such as:

- “The studio will review…”
- “Calypso Digital Studio builds…”
- “Share…” or “Describe…”

### Evan’s biography

The personal biography on the About page will remain in first person. This preserves the direct personal introduction while keeping the rest of the site consistent as a studio brand.

## Scope

The review will cover all customer-facing website copy, including:

- Home;
- About;
- Services;
- Process;
- Work and project descriptions;
- Start Your Project;
- shared navigation, footer, buttons, and calls to action;
- intake form headings, questions, labels, helper text, validation messages, draft notices, and review copy;
- submission confirmation copy;
- owner and client email wording.

Internal documentation, source-code comments, test descriptions, development notes, and PR text are outside the copy-editing scope unless they must change to support updated assertions.

## Editing Rules

### Punctuation

Unnecessary em dashes will be replaced with periods, commas, colons, parentheses, or rewritten sentence structures. Em dashes may remain only when they clearly improve a sentence and do not create the repeated dash-heavy style being corrected.

Necessary hyphens inside compound words will remain.

### Slash-heavy wording

Customer-facing shorthand such as “website/app,” “email/text,” or “booking/payments” will be rewritten as complete phrases. Slashes may remain in URLs, technical identifiers, and other places where they are functional rather than stylistic.

### Sentence patterns

Repeated constructions will be reduced, especially:

- “This helps…”;
- “You do not need…”;
- “The goal is not…”;
- “what the business needs…” repeated several times near each other;
- strings of three or more abstract nouns joined by commas.

The replacement copy should vary sentence openings and favor concrete explanations.

### Marketing language

Abstract or generic language will be simplified when it does not add useful meaning. The edit should not introduce exaggerated claims, false urgency, invented authority, or premium-sounding filler.

### Numbers and ranges

Customer-facing prose may spell out short number ranges, such as “two to three business days,” when that reads more naturally. Numeric forms may remain in compact interface elements, reference numbers, dates, prices, and other places where scanning matters.

## Examples

Current:

> Tell me what the business needs—without translating it into technical language.

Revised direction:

> Describe what the business needs in your own words. Technical language is not required.

Current:

> I’ll personally review the information and contact you within 2–3 business days.

Revised direction:

> Calypso Digital Studio will review the information and respond within two to three business days.

Current:

> We clarify goals, priorities, content, constraints, and the people who will use the finished work.

Revised direction:

> The discovery conversation confirms the goals, priorities, available content, project limits, and intended users.

These examples establish the direction but do not require every sentence to follow the same structure.

## Content Boundaries

This pass will not:

- change service offerings;
- add or remove pages;
- change the intake data model;
- alter validation rules or submission behavior;
- change Turnstile, Resend, Cloudflare, or deployment configuration;
- revise prices, policies, response times, or project commitments;
- change visual layout or styling except where a copy assertion requires no visual change;
- turn the site into a full third-person biography of Evan.

## Implementation Approach

The implementation will begin with a repository-wide audit of rendered customer-facing strings. Copy will be grouped by surface:

1. marketing pages and shared content;
2. intake form and interface feedback;
3. confirmation and email messages;
4. project and service descriptions.

Each group will be edited conservatively. Existing tests that assert exact copy will be updated only after the replacement wording is finalized.

A focused automated check will scan rendered customer-facing output for prohibited copy patterns. The check should target unnecessary em dashes and known removed phrases without flagging functional hyphens, source-code syntax, URLs, or internal documentation.

## Verification

Verification will include:

- focused tests for updated customer-facing text;
- a rendered-output scan for unwanted em dashes and retired phrases;
- existing unit tests;
- asset and content validation;
- Astro and TypeScript checks;
- production build;
- build-output verification;
- Chromium and WebKit end-to-end tests.

The final review will compare the changed copy against the original facts and promises to confirm that the edit changed tone and readability rather than meaning.

## Acceptance Criteria

The work is complete when:

- the full public website has been reviewed;
- studio-facing copy consistently uses Calypso Digital Studio or the studio rather than “we” or unnecessary first-person language;
- Evan’s personal biography remains first person;
- unnecessary em dashes and slash-heavy phrases have been removed from customer-facing prose;
- repetitive and overly formal wording has been simplified;
- necessary compound-word hyphens remain correct;
- form behavior, validation, submissions, and emails still function as before;
- all required verification passes.
