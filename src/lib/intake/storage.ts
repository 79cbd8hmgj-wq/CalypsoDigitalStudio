import { isValidSubmissionId } from './reference';
import type { IntakeAnswers, IntakeDraft, WizardStepIndex } from './types';

export const DRAFT_KEY = 'calypso:intake:v1';
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createEmptyAnswers(): IntakeAnswers {
  return {
    business: {
      fullName: '', businessName: '', email: '', phone: '', location: '', serviceAreas: [],
      existingWebsite: '', socialLinks: [], offer: '', customers: '', difference: ''
    },
    project: { primaryType: '', addOns: [], otherAddOn: '' },
    needs: {
      goals: [], otherGoal: '', pages: [], otherPage: '', features: [], otherFeature: '',
      redesign: { websiteUrl: '', platform: '', worksWell: '', changeMost: '', contentPreference: '', mediaPreference: '', migrateContent: '', brokenIssues: '' },
      store: { productCount: '', categoryCount: '', productTypes: [], variations: '', shipping: '', localDelivery: '', localPickup: '', inventory: '', discounts: '', customOrders: '', taxStatus: '', paymentProvider: '', descriptionsStatus: '', photosStatus: '', migration: '' },
      customTool: { processToImprove: '', currentProcess: '', users: '', inputs: '', outputs: '', accessLevels: '', notifications: '', reports: '', devices: [], integrations: '', biggestProblem: '', successLooksLike: '' },
      support: { websiteUrl: '', platform: '', helpTypes: [], otherHelp: '', supportCadence: '', urgency: '', currentIssue: '', desiredResult: '', accessStatus: '' },
      notSure: { improveOnline: '', currentProblem: '', desiredCapabilities: '', existingWebsite: '', outcomes: [] },
      booking: { mode: '', services: '', provider: '', deposit: '' },
      payments: { purposes: [], otherPurpose: '', provider: '' },
      customForms: { audience: '', information: '', afterSubmit: '' },
      maintenance: { cadence: '', frequency: '' }
    },
    materials: {
      available: [], visualWords: [], customVisualWord: '', brandMustRemain: '', avoid: '',
      likedSites: [], likedReasons: '', dislikedSites: [], dislikedReasons: ''
    },
    budgetAndTiming: {
      budgetRange: '', supportType: '', preferredTiming: '', launchDate: '', dateFlexibility: '',
      deadlineContext: '', readiness: '', decisionMaker: '', otherApprovers: ''
    },
    contact: {
      preferredMethod: '', preferredTime: '', timeZone: '', socialAccount: '', additionalInfo: '', referralSource: ''
    },
    consent: { accurate: false, contactPermission: false }
  };
}

export function createEmptyDraft(now = new Date()): IntakeDraft {
  const timestamp = now.toISOString();
  return {
    version: 1,
    submissionId: crypto.randomUUID(),
    startedAt: timestamp,
    updatedAt: timestamp,
    currentStep: 0,
    answers: createEmptyAnswers()
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasObjectKeys(value: unknown, keys: readonly string[]): boolean {
  return isObject(value) && keys.every((key) => key in value);
}

function isDraft(value: unknown): value is IntakeDraft {
  if (!isObject(value)) return false;
  if (value.version !== 1 || typeof value.submissionId !== 'string' || !isValidSubmissionId(value.submissionId)) return false;
  if (typeof value.startedAt !== 'string' || typeof value.updatedAt !== 'string') return false;
  if (Number.isNaN(Date.parse(value.startedAt)) || Number.isNaN(Date.parse(value.updatedAt))) return false;
  if (!Number.isInteger(value.currentStep) || Number(value.currentStep) < 0 || Number(value.currentStep) > 5) return false;
  if (!hasObjectKeys(value.answers, ['business', 'project', 'needs', 'materials', 'budgetAndTiming', 'contact', 'consent'])) return false;
  const answers = value.answers as Record<string, unknown>;
  if (!hasObjectKeys(answers.business, ['fullName', 'businessName', 'email', 'serviceAreas'])) return false;
  if (!hasObjectKeys(answers.project, ['primaryType', 'addOns'])) return false;
  if (!hasObjectKeys(answers.needs, ['goals', 'redesign', 'store', 'customTool', 'support', 'notSure', 'booking', 'payments', 'customForms', 'maintenance'])) return false;
  if (!hasObjectKeys(answers.materials, ['available', 'visualWords'])) return false;
  if (!hasObjectKeys(answers.budgetAndTiming, ['budgetRange', 'preferredTiming'])) return false;
  if (!hasObjectKeys(answers.contact, ['preferredMethod'])) return false;
  if (!hasObjectKeys(answers.consent, ['accurate', 'contactPermission'])) return false;
  return true;
}

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function saveDraft(draft: IntakeDraft, storage: Storage | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(now: Date | number = new Date(), storage: Storage | null = defaultStorage()): IntakeDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      storage.removeItem(DRAFT_KEY);
      return null;
    }
    if (!isDraft(parsed)) {
      storage.removeItem(DRAFT_KEY);
      return null;
    }
    const nowMs = now instanceof Date ? now.getTime() : now;
    if (nowMs - Date.parse(parsed.updatedAt) > DRAFT_TTL_MS) {
      storage.removeItem(DRAFT_KEY);
      return null;
    }
    parsed.currentStep = parsed.currentStep as WizardStepIndex;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(storage: Storage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(DRAFT_KEY);
  } catch {
    // Storage may be blocked by browser privacy settings.
  }
}
