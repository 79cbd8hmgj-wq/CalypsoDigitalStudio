import type { IntakeAnswers, NeedsAnswers } from './types';

export interface IntakeConditions {
  showStandardWebsite: boolean;
  showRedesign: boolean;
  showStore: boolean;
  showCustomTool: boolean;
  showSupport: boolean;
  showNotSure: boolean;
  showBooking: boolean;
  showStandalonePayments: boolean;
  showCustomForms: boolean;
  showMaintenance: boolean;
  requirePhone: boolean;
  requireSocialContact: boolean;
  requireLaunchDate: boolean;
  requireOtherAddOn: boolean;
}

export function deriveConditions(answers: IntakeAnswers): IntakeConditions {
  const primary = answers.project.primaryType;
  const addOns = new Set(answers.project.addOns);
  const showStore = primary === 'online-store' || addOns.has('product-sales');
  const hasSocialLink = answers.business.socialLinks.some((value) => value.trim().length > 0);

  return {
    showStandardWebsite: primary === 'new-website' || primary === 'website-redesign',
    showRedesign: primary === 'website-redesign',
    showStore,
    showCustomTool: primary === 'custom-tool',
    showSupport: primary === 'ongoing-support',
    showNotSure: primary === 'not-sure',
    showBooking: addOns.has('booking'),
    showStandalonePayments: addOns.has('online-payments') && !showStore,
    showCustomForms: addOns.has('custom-forms'),
    showMaintenance: addOns.has('maintenance'),
    requirePhone: answers.contact.preferredMethod === 'phone' || answers.contact.preferredMethod === 'text',
    requireSocialContact:
      (answers.contact.preferredMethod === 'instagram' || answers.contact.preferredMethod === 'facebook') &&
      !hasSocialLink,
    requireLaunchDate: answers.budgetAndTiming.dateFlexibility === 'fixed',
    requireOtherAddOn: addOns.has('other')
  };
}

export function requiredPathsFor(answers: IntakeAnswers): string[] {
  const conditions = deriveConditions(answers);
  const paths = [
    'business.fullName',
    'business.businessName',
    'business.email',
    'business.location',
    'business.serviceAreas',
    'business.offer',
    'business.customers',
    'project.primaryType',
    'needs.goals',
    'budgetAndTiming.budgetRange',
    'budgetAndTiming.preferredTiming',
    'budgetAndTiming.readiness',
    'budgetAndTiming.decisionMaker',
    'contact.preferredMethod',
    'consent.accurate',
    'consent.contactPermission'
  ];

  if (conditions.showStandardWebsite) paths.push('needs.pages', 'needs.features');
  if (conditions.showRedesign) {
    paths.push('needs.redesign.changeMost');
    if (!answers.business.existingWebsite.trim()) paths.push('needs.redesign.websiteUrl');
  }
  if (conditions.showStore) paths.push('needs.store.productCount', 'needs.store.productTypes');
  if (conditions.showCustomTool) {
    paths.push(
      'needs.customTool.processToImprove',
      'needs.customTool.currentProcess',
      'needs.customTool.users',
      'needs.customTool.outputs',
      'needs.customTool.biggestProblem',
      'needs.customTool.successLooksLike'
    );
  }
  if (conditions.showSupport) {
    if (!answers.business.existingWebsite.trim()) paths.push('needs.support.websiteUrl');
    paths.push(
      'needs.support.helpTypes',
      'needs.support.supportCadence',
      'needs.support.urgency',
      'needs.support.currentIssue',
      'needs.support.desiredResult',
      'needs.support.accessStatus'
    );
  }
  if (conditions.showNotSure) {
    paths.push(
      'needs.notSure.improveOnline',
      'needs.notSure.currentProblem',
      'needs.notSure.desiredCapabilities',
      'needs.notSure.outcomes'
    );
  }
  if (conditions.showBooking) paths.push('needs.booking.mode', 'needs.booking.services');
  if (conditions.showStandalonePayments) paths.push('needs.payments.purposes');
  if (conditions.showCustomForms) {
    paths.push('needs.customForms.audience', 'needs.customForms.information', 'needs.customForms.afterSubmit');
  }
  if (conditions.showMaintenance) paths.push('needs.maintenance.cadence', 'needs.maintenance.frequency');
  if (conditions.requirePhone) paths.push('business.phone');
  if (conditions.requireSocialContact) paths.push('contact.socialAccount');
  if (conditions.requireLaunchDate) paths.push('budgetAndTiming.launchDate');
  if (conditions.requireOtherAddOn) paths.push('project.otherAddOn');
  if (answers.needs.goals.includes('other')) paths.push('needs.otherGoal');
  if (answers.needs.pages.includes('other')) paths.push('needs.otherPage');
  if (answers.needs.features.includes('other')) paths.push('needs.otherFeature');
  if (answers.needs.payments.purposes.includes('other')) paths.push('needs.payments.otherPurpose');
  if (answers.needs.support.helpTypes.includes('other')) paths.push('needs.support.otherHelp');
  if (answers.materials.visualWords.includes('other')) paths.push('materials.customVisualWord');

  return [...new Set(paths)];
}

const emptyRedesign = (): NeedsAnswers['redesign'] => ({
  websiteUrl: '', platform: '', worksWell: '', changeMost: '', contentPreference: '',
  mediaPreference: '', migrateContent: '', brokenIssues: ''
});
const emptyStore = (): NeedsAnswers['store'] => ({
  productCount: '', categoryCount: '', productTypes: [], variations: '', shipping: '', localDelivery: '',
  localPickup: '', inventory: '', discounts: '', customOrders: '', taxStatus: '', paymentProvider: '',
  descriptionsStatus: '', photosStatus: '', migration: ''
});
const emptyCustomTool = (): NeedsAnswers['customTool'] => ({
  processToImprove: '', currentProcess: '', users: '', inputs: '', outputs: '', accessLevels: '',
  notifications: '', reports: '', devices: [], integrations: '', biggestProblem: '', successLooksLike: ''
});
const emptySupport = (): NeedsAnswers['support'] => ({
  websiteUrl: '', platform: '', helpTypes: [], otherHelp: '', supportCadence: '', urgency: '',
  currentIssue: '', desiredResult: '', accessStatus: ''
});
const emptyNotSure = (): NeedsAnswers['notSure'] => ({
  improveOnline: '', currentProblem: '', desiredCapabilities: '', existingWebsite: '', outcomes: []
});
const emptyBooking = (): NeedsAnswers['booking'] => ({ mode: '', services: '', provider: '', deposit: '' });
const emptyPayments = (): NeedsAnswers['payments'] => ({ purposes: [], otherPurpose: '', provider: '' });
const emptyCustomForms = (): NeedsAnswers['customForms'] => ({ audience: '', information: '', afterSubmit: '' });
const emptyMaintenance = (): NeedsAnswers['maintenance'] => ({ cadence: '', frequency: '' });

export function clearIrrelevantNeeds(answers: IntakeAnswers): NeedsAnswers {
  const conditions = deriveConditions(answers);
  const needs = structuredClone(answers.needs);
  if (!conditions.showStandardWebsite) {
    needs.pages = [];
    needs.otherPage = '';
    needs.features = [];
    needs.otherFeature = '';
  }
  if (!conditions.showRedesign) needs.redesign = emptyRedesign();
  if (!conditions.showStore) needs.store = emptyStore();
  if (!conditions.showCustomTool) needs.customTool = emptyCustomTool();
  if (!conditions.showSupport) needs.support = emptySupport();
  if (!conditions.showNotSure) needs.notSure = emptyNotSure();
  if (!conditions.showBooking) needs.booking = emptyBooking();
  if (!conditions.showStandalonePayments) needs.payments = emptyPayments();
  if (!conditions.showCustomForms) needs.customForms = emptyCustomForms();
  if (!conditions.showMaintenance) needs.maintenance = emptyMaintenance();
  return needs;
}
