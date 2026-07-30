export type PrimaryProjectType =
  | 'new-website'
  | 'website-redesign'
  | 'online-store'
  | 'custom-tool'
  | 'ongoing-support'
  | 'not-sure';

export type AddOn =
  | 'booking'
  | 'online-payments'
  | 'product-sales'
  | 'custom-forms'
  | 'gallery'
  | 'testimonials'
  | 'email-signup'
  | 'blog'
  | 'maintenance'
  | 'seo-setup'
  | 'analytics'
  | 'business-email'
  | 'other';

export type ContactMethod = 'email' | 'phone' | 'text' | 'instagram' | 'facebook';
export type WizardStepIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface BusinessAnswers {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  location: string;
  serviceAreas: string[];
  existingWebsite: string;
  socialLinks: string[];
  offer: string;
  customers: string;
  difference: string;
}

export interface ProjectAnswers {
  primaryType: PrimaryProjectType | '';
  addOns: AddOn[];
  otherAddOn: string;
}

export interface RedesignNeeds {
  websiteUrl: string;
  platform: string;
  worksWell: string;
  changeMost: string;
  contentPreference: string;
  mediaPreference: string;
  migrateContent: string;
  brokenIssues: string;
}

export interface StoreNeeds {
  productCount: string;
  categoryCount: string;
  productTypes: string[];
  variations: string;
  shipping: string;
  localDelivery: string;
  localPickup: string;
  inventory: string;
  discounts: string;
  customOrders: string;
  taxStatus: string;
  paymentProvider: string;
  descriptionsStatus: string;
  photosStatus: string;
  migration: string;
}

export interface CustomToolNeeds {
  processToImprove: string;
  currentProcess: string;
  users: string;
  inputs: string;
  outputs: string;
  accessLevels: string;
  notifications: string;
  reports: string;
  devices: string[];
  integrations: string;
  biggestProblem: string;
  successLooksLike: string;
}

export interface SupportNeeds {
  websiteUrl: string;
  platform: string;
  helpTypes: string[];
  otherHelp: string;
  supportCadence: string;
  urgency: string;
  currentIssue: string;
  desiredResult: string;
  accessStatus: string;
}

export interface NotSureNeeds {
  improveOnline: string;
  currentProblem: string;
  desiredCapabilities: string;
  existingWebsite: string;
  outcomes: string[];
}

export interface BookingNeeds {
  mode: string;
  services: string;
  provider: string;
  deposit: string;
}

export interface PaymentNeeds {
  purposes: string[];
  otherPurpose: string;
  provider: string;
}

export interface CustomFormNeeds {
  audience: string;
  information: string;
  afterSubmit: string;
}

export interface MaintenanceNeeds {
  cadence: string;
  frequency: string;
}

export interface NeedsAnswers {
  goals: string[];
  otherGoal: string;
  pages: string[];
  otherPage: string;
  features: string[];
  otherFeature: string;
  redesign: RedesignNeeds;
  store: StoreNeeds;
  customTool: CustomToolNeeds;
  support: SupportNeeds;
  notSure: NotSureNeeds;
  booking: BookingNeeds;
  payments: PaymentNeeds;
  customForms: CustomFormNeeds;
  maintenance: MaintenanceNeeds;
}

export interface MaterialsAnswers {
  available: string[];
  visualWords: string[];
  customVisualWord: string;
  brandMustRemain: string;
  avoid: string;
  likedSites: string[];
  likedReasons: string;
  dislikedSites: string[];
  dislikedReasons: string;
}

export interface BudgetAndTimingAnswers {
  budgetRange: string;
  supportType: string;
  preferredTiming: string;
  launchDate: string;
  dateFlexibility: string;
  deadlineContext: string;
  readiness: string;
  decisionMaker: string;
  otherApprovers: string;
}

export interface ContactAnswers {
  preferredMethod: ContactMethod | '';
  preferredTime: string;
  timeZone: string;
  socialAccount: string;
  additionalInfo: string;
  referralSource: string;
}

export interface ConsentAnswers {
  accurate: boolean;
  contactPermission: boolean;
}

export interface IntakeAnswers {
  business: BusinessAnswers;
  project: ProjectAnswers;
  needs: NeedsAnswers;
  materials: MaterialsAnswers;
  budgetAndTiming: BudgetAndTimingAnswers;
  contact: ContactAnswers;
  consent: ConsentAnswers;
}

export interface IntakeDraft {
  version: 1;
  submissionId: string;
  startedAt: string;
  updatedAt: string;
  currentStep: WizardStepIndex;
  answers: IntakeAnswers;
}

export interface IntakeSubmissionRequest {
  version: 1;
  submissionId: string;
  startedAt: string;
  answers: IntakeAnswers;
  turnstileToken: string;
  honeypot: string;
}

export interface NormalizedIntake {
  version: 1;
  submissionId: string;
  startedAt: string;
  reference: string;
  answers: IntakeAnswers;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: NormalizedIntake }
  | { ok: false; issues: ValidationIssue[] };
