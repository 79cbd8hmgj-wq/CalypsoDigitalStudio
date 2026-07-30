# Remove Budget, Timing, and Readiness Step

**Date:** 2026-07-30  
**Status:** Approved design  
**Repository:** `79cbd8hmgj-wq/CalypsoDigitalStudio`

## Objective

Remove the entire client-facing **Budget, timing, and readiness** step because the questions are misleading and unnecessary for the intake process.

The intake flow will become a five-step experience:

1. Business
2. Project
3. Needs
4. Materials
5. Review and contact

The removed information must also disappear from the review screen and from both owner and client emails.

## Chosen approach

Use a compatibility-first removal.

The `budgetAndTiming` object remains in the internal draft and API data structure for now, but it is not displayed, required, validated for business rules, or included in generated summaries. Existing saved drafts continue to load without a schema-version migration, while clients no longer see or submit budget, timing, readiness, launch-date, or approval information.

## User experience

### Removed

- The full Step 5 component currently titled **Budget, timing, and readiness**.
- Approximate budget range.
- Support type and one-time or recurring support budget.
- Preferred timing.
- Specific launch date and date flexibility.
- Deadline context.
- Readiness to begin.
- Decision-maker and other approvers.
- The **Budget & timing** review section.
- The **Budget & timing** section in owner and client emails.

### Updated flow

- Progress indicators show five steps instead of six.
- Review and contact becomes Step 5 of 5.
- Back, continue, edit, progress-navigation, and URL-hash behavior use the new indexes.
- Existing saved drafts that were previously on the removed step open at the nearest valid step, which is Review and contact.

## Architecture and component changes

### Wizard composition

- Remove the `BudgetStep.astro` import and rendered component from `IntakeWizard.astro`.
- Keep the file only if another active import remains; otherwise delete it.
- Update wizard step metadata in `src/data/intake` so there are five ordered steps.
- Update `ReviewStep.astro` copy and step numbering.
- Update `WizardProgress.astro` and any fixed six-column layout assumptions to render five steps.

### Client-side state and navigation

- Update `src/scripts/intake-wizard.ts` to use valid step indexes `0` through `4`.
- Remove `budgetAndTiming.` from step-prefix validation routing.
- Remove budget-specific conditional DOM handling:
  - `data-budget-set`
  - `data-support-budget`
- Remap review behavior from index `5` to index `4`.
- Clamp restored drafts with `currentStep` greater than `4` to `4`.
- Preserve the internal `budgetAndTiming` object in drafts as an empty compatibility container.
- Do not restore old budget values into any visible controls because no such controls remain.

### Validation

- Remove all `budgetAndTiming.*` entries from `requiredPathsFor`.
- Remove conditional launch-date requirements.
- Remove budget-range, support-budget, timing, readiness, and decision-maker business-rule validation from the server schema.
- Keep structural acceptance of the `budgetAndTiming` object and its current known keys so old drafts and payloads are not rejected solely because they contain historical fields.
- Normalize retained values only as part of existing recursive normalization; they are ignored by downstream summaries.

### Review and email generation

- Remove the `Budget & timing` summary section from `buildSummarySections`.
- Review rendering automatically reflects the new section count and must not render an empty placeholder card for the removed section.
- Owner and client emails must not include budget, timing, readiness, launch-date, or approval fields.
- Existing references, business details, project details, needs, materials, and contact sections remain unchanged.

## Data flow

1. A new or restored draft still contains an internal `budgetAndTiming` object.
2. The browser collects answers only from visible, allowlisted form fields; no budget/timing fields exist in the DOM.
3. The submitted payload includes the compatibility object, normally empty.
4. Server validation accepts the object but does not require or business-validate its contents.
5. Email and review summary builders ignore the object entirely.
6. The final visible and delivered output contains no budget/timing information.

## Backward compatibility

- No form-version increase.
- No forced deletion of saved drafts.
- Old drafts containing budget/timing values continue to load.
- A draft saved on former step index `4` or `5` is clamped to the new Review and contact step.
- Historical budget/timing values are not shown or emailed.
- Strict unknown-field rejection remains unchanged for unrelated fields.

## Error handling

- Restoring an old draft must never leave the wizard on a nonexistent step.
- Progress buttons must not target removed indexes.
- Server validation errors must still route to one of the five existing steps.
- Submission and Turnstile behavior remain unchanged.
- Email-delivery behavior remains unchanged.

## Testing strategy

### Unit and foundation tests

- Wizard metadata contains exactly five steps in the intended order.
- `requiredPathsFor` never includes a `budgetAndTiming.*` path.
- Server validation accepts a valid submission with an empty compatibility object.
- Server validation accepts an older valid payload containing recognized historical budget/timing values.
- Summary generation excludes the `Budget & timing` section and all removed labels.
- Draft restoration clamps former step indexes to the new final step.
- Client-side step validation and navigation use indexes `0` through `4`.

### Component and DOM tests

- No budget question, timing question, readiness question, launch-date field, or decision-maker field appears in the rendered form.
- Review and contact is labeled Step 5 of 5.
- Progress UI contains five steps.
- No empty review card is created for the removed section.

### End-to-end tests

- Complete and submit the five-step intake flow in Chromium and WebKit.
- Navigate backward and through completed progress steps without reaching a removed step.
- Restore a legacy draft whose `currentStep` points to the removed step and confirm Review and contact opens.
- Confirm the request payload and generated confirmation flow work without any client-visible budget/timing entry.

## Non-goals

- Redesigning the remaining intake questions.
- Changing email delivery providers or Turnstile configuration.
- Removing `budgetAndTiming` from TypeScript types and API payloads in this change.
- Migrating the form to a new schema version.
- Recovering or displaying historical budget/timing answers.

## Acceptance criteria

- The live intake form has five steps.
- No budget, timing, readiness, launch-date, or approval question is visible.
- No removed information appears in review or email output.
- Existing drafts remain usable.
- Old drafts cannot open on a nonexistent step.
- Intake submission, Turnstile verification, and email delivery continue to function.
- The full unit, build, and browser test suite passes.
