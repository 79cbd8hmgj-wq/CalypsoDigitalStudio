import type { AddOn, ContactMethod, PrimaryProjectType, WizardStepIndex } from '../lib/intake/types';

export interface IntakeOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export const wizardSteps: ReadonlyArray<{ index: WizardStepIndex; id: string; label: string }> = [
  { index: 0, id: 'business', label: 'Your Business' },
  { index: 1, id: 'project', label: 'Project Type' },
  { index: 2, id: 'needs', label: 'Project Needs' },
  { index: 3, id: 'materials', label: 'Branding & Materials' },
  { index: 4, id: 'review', label: 'Review & Contact' }
];

export const primaryProjectTypes: ReadonlyArray<IntakeOption<PrimaryProjectType>> = [
  { value: 'new-website', label: 'New business website', description: 'Build a professional website from the beginning.' },
  { value: 'website-redesign', label: 'Website redesign', description: 'Replace, reorganize, or improve an existing website.' },
  { value: 'online-store', label: 'Online store', description: 'Sell products, accept payments, and organize purchasing steps.' },
  { value: 'custom-tool', label: 'Custom digital tool', description: 'Improve a repeated business process with purpose-built software.' },
  { value: 'ongoing-support', label: 'Ongoing website support', description: 'Fix, improve, or maintain an existing website.' },
  { value: 'not-sure', label: 'Not sure yet', description: 'Describe the problem and receive a recommendation.' }
];

export const addOnOptions: ReadonlyArray<IntakeOption<AddOn>> = [
  { value: 'booking', label: 'Booking or appointment requests' },
  { value: 'online-payments', label: 'Online payments' },
  { value: 'product-sales', label: 'Product sales' },
  { value: 'custom-forms', label: 'Custom contact, intake, or quote forms' },
  { value: 'gallery', label: 'Photo gallery or portfolio' },
  { value: 'testimonials', label: 'Customer reviews or testimonials' },
  { value: 'email-signup', label: 'Email signup' },
  { value: 'blog', label: 'Blog or updates section' },
  { value: 'maintenance', label: 'Website maintenance' },
  { value: 'seo-setup', label: 'Search-engine setup' },
  { value: 'analytics', label: 'Visitor analytics' },
  { value: 'business-email', label: 'Business email setup' },
  { value: 'other', label: 'Something else' }
];

export const serviceAreaOptions = ['local', 'regional', 'nationwide', 'online', 'combination'] as const;
export const goalOptions = ['professional', 'explain-business', 'inquiries', 'bookings', 'sell-products', 'improve-process', 'replace-paperwork', 'manage-information', 'other'] as const;
export const pageOptions = ['home', 'about', 'services', 'service-pages', 'portfolio', 'testimonials', 'faq', 'contact', 'booking', 'policies', 'blog', 'other', 'not-sure'] as const;
export const featureOptions = ['contact-form', 'quote-form', 'booking-request', 'map', 'social-links', 'testimonials', 'gallery', 'downloads', 'email-signup', 'online-payment', 'members-only', 'multiple-locations', 'other', 'not-sure'] as const;
export const materialOptions = ['logo', 'brand-colors', 'fonts', 'business-photos', 'product-photos', 'page-copy', 'service-descriptions', 'product-information', 'testimonials', 'domain', 'hosting', 'business-email', 'policies', 'existing-content', 'none'] as const;
export const visualWordOptions = ['warm', 'bold', 'modern', 'playful', 'elegant', 'minimal', 'professional', 'earthy', 'luxurious', 'energetic', 'calm', 'editorial', 'other'] as const;
export const websiteBudgetOptions = ['under-500', '500-1000', '1000-2500', '2500-5000', 'over-5000', 'not-sure'] as const;
export const customToolBudgetOptions = ['under-1000', '1000-2500', '2500-5000', '5000-10000', 'over-10000', 'not-sure'] as const;
export const supportOneTimeBudgetOptions = ['under-250', '250-500', '500-1000', 'over-1000', 'not-sure'] as const;
export const supportMonthlyBudgetOptions = ['under-100-month', '100-250-month', '250-500-month', 'over-500-month', 'not-sure'] as const;
export const timingOptions = ['asap', 'within-month', '1-3-months', '3-6-months', 'flexible', 'not-sure'] as const;
export const readinessOptions = ['ready', 'preparing-materials', 'comparing-options', 'early-research', 'not-sure'] as const;
export const decisionMakerOptions = ['client', 'shared', 'someone-else'] as const;
export const productCountOptions = ['1-10', '11-25', '26-50', '51-100', 'over-100', 'not-sure'] as const;
export const productTypeOptions = ['physical', 'digital', 'made-to-order', 'service-based', 'combination'] as const;
export const supportHelpOptions = ['content', 'visual', 'broken-feature', 'performance', 'mobile-layout', 'maintenance', 'security', 'new-feature', 'other'] as const;
export const supportUrgencyOptions = ['normal', 'time-sensitive', 'partly-unusable', 'unavailable'] as const;
export const bookingModeOptions = ['request-only', 'confirmed'] as const;
export const paymentPurposeOptions = ['deposits', 'invoices', 'service-payments', 'donations', 'memberships', 'other'] as const;
export const contactMethodOptions: ReadonlyArray<IntakeOption<ContactMethod>> = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone call' },
  { value: 'text', label: 'Text message' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' }
];

export const yesNoNotSureOptions = ['yes', 'no', 'not-sure'] as const;
export const optionLabels: Record<string, string> = Object.fromEntries([
  ...primaryProjectTypes,
  ...addOnOptions,
  ...contactMethodOptions
].map((option) => [option.value, option.label]));
