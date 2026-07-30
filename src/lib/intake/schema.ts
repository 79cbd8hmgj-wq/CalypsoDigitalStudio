import {
  addOnOptions,
  contactMethodOptions,
  featureOptions,
  goalOptions,
  materialOptions,
  pageOptions,
  primaryProjectTypes,
  productCountOptions,
  productTypeOptions,
  serviceAreaOptions,
  supportHelpOptions,
  visualWordOptions,
} from '../../data/intake';
import { clearIrrelevantNeeds, requiredPathsFor } from './conditions';
import { createSubmissionReference, isValidSubmissionId } from './reference';
import type { IntakeAnswers, IntakeSubmissionRequest, ValidationIssue, ValidationResult } from './types';

export const MAX_REQUEST_BYTES = 100 * 1024;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const primaryValues = new Set(primaryProjectTypes.map((item) => item.value));
const addOnValues = new Set(addOnOptions.map((item) => item.value));
const contactValues = new Set(contactMethodOptions.map((item) => item.value));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addUnknownKeyIssues(value: Record<string, unknown>, allowed: readonly string[], prefix: string, issues: ValidationIssue[]): void {
  const allow = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allow.has(key)) issues.push({ path: prefix ? `${prefix}.${key}` : key, message: 'Unknown field.' });
  }
}

function getPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => isRecord(current) ? current[key] : undefined, value);
}


function setPath(value: unknown, path: string, replacement: unknown): void {
  const keys = path.split('.');
  let current: unknown = value;
  for (let index = 0; index < keys.length - 1; index += 1) {
    if (!isRecord(current)) return;
    current = current[keys[index] as string];
  }
  if (isRecord(current)) current[keys[keys.length - 1] as string] = replacement;
}

function isEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return value === false;
  return value === null || value === undefined;
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeRecursively(value: unknown): unknown {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    const normalized = value.map(normalizeRecursively);
    return [...new Set(normalized.map((item) => JSON.stringify(item)))].map((item) => JSON.parse(item) as unknown);
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeRecursively(item)]));
  }
  return value;
}

function validateString(answers: IntakeAnswers, path: string, max: number, issues: ValidationIssue[]): void {
  const value = getPath(answers, path);
  if (typeof value !== 'string') {
    issues.push({ path, message: 'Enter a valid value.' });
    return;
  }
  if (value.length > max) issues.push({ path, message: `Use ${max} characters or fewer.` });
}

function validateArray(values: unknown, allowed: ReadonlySet<string>, path: string, maxCount: number | null, issues: ValidationIssue[]): void {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !allowed.has(value))) {
    issues.push({ path, message: 'Select valid options.' });
    return;
  }
  if (maxCount !== null && values.length > maxCount) issues.push({ path, message: `Select no more than ${maxCount}.` });
}

function validateUrlField(answers: IntakeAnswers, path: string, issues: ValidationIssue[]): void {
  const value = getPath(answers, path);
  if (typeof value !== 'string') {
    issues.push({ path, message: 'Enter a valid web address.' });
    return;
  }
  if (value.length > 500) {
    issues.push({ path, message: 'Use 500 characters or fewer.' });
    return;
  }
  const normalized = normalizeUrl(value);
  if (normalized === null) {
    issues.push({ path, message: 'Use an HTTP or HTTPS web address.' });
    return;
  }
  setPath(answers, path, normalized);
}

function validateKnownShapes(request: Record<string, unknown>, issues: ValidationIssue[]): void {
  addUnknownKeyIssues(request, ['version', 'submissionId', 'startedAt', 'answers', 'turnstileToken', 'honeypot'], '', issues);
  if (!isRecord(request.answers)) return;
  addUnknownKeyIssues(request.answers, ['business', 'project', 'needs', 'materials', 'budgetAndTiming', 'contact', 'consent'], 'answers', issues);
  const sectionKeys: Record<string, readonly string[]> = {
    business: ['fullName', 'businessName', 'email', 'phone', 'location', 'serviceAreas', 'existingWebsite', 'socialLinks', 'offer', 'customers', 'difference'],
    project: ['primaryType', 'addOns', 'otherAddOn'],
    materials: ['available', 'visualWords', 'customVisualWord', 'brandMustRemain', 'avoid', 'likedSites', 'likedReasons', 'dislikedSites', 'dislikedReasons'],
    budgetAndTiming: ['budgetRange', 'supportType', 'preferredTiming', 'launchDate', 'dateFlexibility', 'deadlineContext', 'readiness', 'decisionMaker', 'otherApprovers'],
    contact: ['preferredMethod', 'preferredTime', 'timeZone', 'socialAccount', 'additionalInfo', 'referralSource'],
    consent: ['accurate', 'contactPermission']
  };
  for (const [section, allowed] of Object.entries(sectionKeys)) {
    const value = request.answers[section];
    if (isRecord(value)) addUnknownKeyIssues(value, allowed, `answers.${section}`, issues);
  }
}

export function validateAndNormalizeIntake(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { ok: false, issues: [{ path: '', message: 'Invalid request.' }] };
  validateKnownShapes(input, issues);
  if (input.version !== 1) issues.push({ path: 'version', message: 'Unsupported form version.' });
  if (typeof input.submissionId !== 'string' || !isValidSubmissionId(input.submissionId)) {
    issues.push({ path: 'submissionId', message: 'Invalid submission identifier.' });
  }
  if (typeof input.startedAt !== 'string' || Number.isNaN(Date.parse(input.startedAt))) {
    issues.push({ path: 'startedAt', message: 'Invalid start time.' });
  }
  if (!isRecord(input.answers)) issues.push({ path: 'answers', message: 'Invalid answers.' });
  if (typeof input.turnstileToken !== 'string') issues.push({ path: 'turnstileToken', message: 'Invalid verification token.' });
  if (typeof input.honeypot !== 'string') issues.push({ path: 'honeypot', message: 'Invalid request.' });
  if (issues.length > 0 && !isRecord(input.answers)) return { ok: false, issues };

  const normalizedInput = normalizeRecursively(input) as IntakeSubmissionRequest;
  const answers = normalizedInput.answers;
  if (!isRecord(answers) || !isRecord(answers.business) || !isRecord(answers.project) || !isRecord(answers.needs) ||
      !isRecord(answers.materials) || !isRecord(answers.budgetAndTiming) || !isRecord(answers.contact) || !isRecord(answers.consent)) {
    issues.push({ path: 'answers', message: 'Invalid answer structure.' });
    return { ok: false, issues };
  }

  if (!primaryValues.has(answers.project.primaryType as never)) issues.push({ path: 'project.primaryType', message: 'Choose a project type.' });
  validateArray(answers.project.addOns, addOnValues, 'project.addOns', null, issues);
  validateArray(answers.business.serviceAreas, new Set(serviceAreaOptions), 'business.serviceAreas', null, issues);
  validateArray(answers.needs.goals, new Set(goalOptions), 'needs.goals', null, issues);
  validateArray(answers.needs.pages, new Set(pageOptions), 'needs.pages', null, issues);
  validateArray(answers.needs.features, new Set(featureOptions), 'needs.features', null, issues);
  validateArray(answers.materials.available, new Set(materialOptions), 'materials.available', null, issues);
  validateArray(answers.materials.visualWords, new Set(visualWordOptions), 'materials.visualWords', 3, issues);
  validateArray(answers.needs.store.productTypes, new Set(productTypeOptions), 'needs.store.productTypes', null, issues);
  validateArray(answers.needs.support.helpTypes, new Set(supportHelpOptions), 'needs.support.helpTypes', null, issues);
  if (!contactValues.has(answers.contact.preferredMethod as never)) issues.push({ path: 'contact.preferredMethod', message: 'Choose a contact method.' });

  const stringLimits: Array<[string, number]> = [
    ['business.fullName', 120], ['business.businessName', 120], ['business.email', 254], ['business.phone', 32], ['business.location', 120],
    ['business.offer', 2000], ['business.customers', 2000], ['business.difference', 2000], ['project.otherAddOn', 500],
    ['needs.otherGoal', 500], ['needs.otherPage', 500], ['needs.otherFeature', 500],
    ['needs.redesign.platform', 120], ['needs.redesign.worksWell', 2000], ['needs.redesign.changeMost', 2000], ['needs.redesign.brokenIssues', 2000],
    ['needs.store.categoryCount', 120], ['needs.store.variations', 2000], ['needs.store.paymentProvider', 120], ['needs.store.migration', 2000],
    ['needs.customTool.processToImprove', 3000], ['needs.customTool.currentProcess', 3000], ['needs.customTool.users', 1000],
    ['needs.customTool.inputs', 2000], ['needs.customTool.outputs', 3000], ['needs.customTool.integrations', 1000],
    ['needs.customTool.biggestProblem', 2000], ['needs.customTool.successLooksLike', 2000],
    ['needs.support.platform', 120], ['needs.support.otherHelp', 500], ['needs.support.currentIssue', 2000], ['needs.support.desiredResult', 2000],
    ['needs.notSure.improveOnline', 2000], ['needs.notSure.currentProblem', 2000], ['needs.notSure.desiredCapabilities', 2000],
    ['needs.booking.services', 1000], ['needs.booking.provider', 120], ['needs.payments.otherPurpose', 500], ['needs.payments.provider', 120],
    ['needs.customForms.audience', 500], ['needs.customForms.information', 2000], ['needs.customForms.afterSubmit', 2000],
    ['needs.maintenance.frequency', 500], ['materials.customVisualWord', 80], ['materials.brandMustRemain', 1000], ['materials.avoid', 1000],
    ['materials.likedReasons', 2000], ['materials.dislikedReasons', 2000],
    ['contact.preferredTime', 500], ['contact.timeZone', 120], ['contact.socialAccount', 500],
    ['contact.additionalInfo', 2000], ['contact.referralSource', 500]
  ];
  for (const [path, max] of stringLimits) validateString(answers, path, max, issues);

  if (!EMAIL_PATTERN.test(answers.business.email)) issues.push({ path: 'business.email', message: 'Enter a valid email address.' });
  const phoneDigits = answers.business.phone.replace(/\D/g, '');
  if (answers.business.phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    issues.push({ path: 'business.phone', message: 'Enter a usable phone number.' });
  }

  validateUrlField(answers, 'business.existingWebsite', issues);
  validateUrlField(answers, 'needs.redesign.websiteUrl', issues);
  validateUrlField(answers, 'needs.support.websiteUrl', issues);
  for (const path of ['business.socialLinks', 'materials.likedSites', 'materials.dislikedSites']) {
    const values = getPath(answers, path);
    const maximum = path === 'business.socialLinks' ? 5 : 3;
    if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
      issues.push({ path, message: 'Enter valid web addresses.' });
      continue;
    }
    if (values.length > maximum) issues.push({ path, message: `Use no more than ${maximum} links.` });
    for (let index = 0; index < values.length; index += 1) {
      const normalized = normalizeUrl(values[index] as string);
      if (normalized === null) issues.push({ path: `${path}.${index}`, message: 'Use an HTTP or HTTPS web address.' });
      else values[index] = normalized;
    }
  }

  if (answers.needs.store.productCount && !new Set(productCountOptions).has(answers.needs.store.productCount as never)) {
    issues.push({ path: 'needs.store.productCount', message: 'Choose a valid product count.' });
  }

  for (const path of requiredPathsFor(answers)) {
    if (isEmpty(getPath(answers, path))) issues.push({ path, message: 'This field is required.' });
  }

  if (issues.length > 0) return { ok: false, issues };
  answers.needs = clearIrrelevantNeeds(answers);

  return {
    ok: true,
    value: {
      version: 1,
      submissionId: normalizedInput.submissionId,
      startedAt: normalizedInput.startedAt,
      reference: createSubmissionReference(normalizedInput.submissionId),
      answers
    }
  };
}
