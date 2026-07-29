import type { IntakeSubmissionRequest } from '../../src/lib/intake/types';

export function createValidWebsiteSubmission(): IntakeSubmissionRequest {
  return {
    version: 1,
    submissionId: '11111111-2222-4333-8444-555555555555',
    startedAt: '2026-07-29T12:00:00.000Z',
    answers: {
      business: {
        fullName: 'Jordan Example',
        businessName: 'Example Studio',
        email: 'jordan@example.com',
        phone: '',
        location: 'Albany, New York',
        serviceAreas: ['regional'],
        existingWebsite: '',
        socialLinks: ['https://instagram.com/example'],
        offer: 'Portrait and event photography.',
        customers: 'Families and small businesses.',
        difference: 'A relaxed and personal experience.'
      },
      project: {
        primaryType: 'new-website',
        addOns: ['gallery', 'custom-forms'],
        otherAddOn: ''
      },
      needs: {
        goals: ['professional', 'inquiries'],
        otherGoal: '',
        pages: ['home', 'about', 'services', 'portfolio', 'contact'],
        otherPage: '',
        features: ['contact-form', 'gallery'],
        otherFeature: '',
        redesign: { websiteUrl: '', platform: '', worksWell: '', changeMost: '', contentPreference: '', mediaPreference: '', migrateContent: '', brokenIssues: '' },
        store: { productCount: '', categoryCount: '', productTypes: [], variations: '', shipping: '', localDelivery: '', localPickup: '', inventory: '', discounts: '', customOrders: '', taxStatus: '', paymentProvider: '', descriptionsStatus: '', photosStatus: '', migration: '' },
        customTool: { processToImprove: '', currentProcess: '', users: '', inputs: '', outputs: '', accessLevels: '', notifications: '', reports: '', devices: [], integrations: '', biggestProblem: '', successLooksLike: '' },
        support: { websiteUrl: '', platform: '', helpTypes: [], otherHelp: '', supportCadence: '', urgency: '', currentIssue: '', desiredResult: '', accessStatus: '' },
        notSure: { improveOnline: '', currentProblem: '', desiredCapabilities: '', existingWebsite: '', outcomes: [] },
        booking: { mode: '', services: '', provider: '', deposit: '' },
        payments: { purposes: [], otherPurpose: '', provider: '' },
        customForms: { audience: 'Potential clients', information: 'Contact details and project needs', afterSubmit: 'Send the details to the business owner' },
        maintenance: { cadence: '', frequency: '' }
      },
      materials: {
        available: ['logo', 'business-photos'],
        visualWords: ['warm', 'professional', 'editorial'],
        customVisualWord: '',
        brandMustRemain: 'Existing logo',
        avoid: 'Cold corporate styling',
        likedSites: ['https://example.org'],
        likedReasons: 'Clear service layout.',
        dislikedSites: [],
        dislikedReasons: ''
      },
      budgetAndTiming: {
        budgetRange: '1000-2500',
        supportType: '',
        preferredTiming: '1-3-months',
        launchDate: '',
        dateFlexibility: 'flexible',
        deadlineContext: '',
        readiness: 'ready',
        decisionMaker: 'client',
        otherApprovers: ''
      },
      contact: {
        preferredMethod: 'email',
        preferredTime: '',
        timeZone: '',
        socialAccount: '',
        additionalInfo: '',
        referralSource: 'Instagram'
      },
      consent: { accurate: true, contactPermission: true }
    },
    turnstileToken: 'test-token',
    honeypot: ''
  };
}
