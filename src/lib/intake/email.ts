import { addOnOptions, primaryProjectTypes } from '../../data/intake';
import type { NormalizedIntake } from './types';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}

export interface SummaryRow {
  label: string;
  value: string;
}

export interface SummarySection {
  title: string;
  rows: SummaryRow[];
}

const primaryLabels = new Map(primaryProjectTypes.map((item) => [item.value, item.label]));
const addOnLabels = new Map(addOnOptions.map((item) => [item.value, item.label]));

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function humanize(value: string): string {
  return value
    .split('-')
    .map((part) => part ? `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}` : '')
    .join(' ');
}

function addRow(rows: SummaryRow[], label: string, value: unknown): void {
  if (Array.isArray(value)) {
    if (value.length > 0) rows.push({ label, value: value.map((item) => humanize(String(item))).join(', ') });
    return;
  }
  if (typeof value === 'boolean') {
    if (value) rows.push({ label, value: 'Yes' });
    return;
  }
  const text = String(value ?? '').trim();
  if (text) rows.push({ label, value: text });
}

export function buildSummarySections(intake: NormalizedIntake): SummarySection[] {
  const { answers } = intake;
  const business: SummaryRow[] = [];
  addRow(business, 'Name', answers.business.fullName);
  addRow(business, 'Business', answers.business.businessName);
  addRow(business, 'Email', answers.business.email);
  addRow(business, 'Phone', answers.business.phone);
  addRow(business, 'Location', answers.business.location);
  addRow(business, 'Service area', answers.business.serviceAreas);
  addRow(business, 'Existing website', answers.business.existingWebsite);
  addRow(business, 'Social links', answers.business.socialLinks);
  addRow(business, 'What the business offers', answers.business.offer);
  addRow(business, 'Main customers', answers.business.customers);
  addRow(business, 'What makes it different', answers.business.difference);

  const project: SummaryRow[] = [];
  addRow(project, 'Primary project', primaryLabels.get(answers.project.primaryType as never) ?? humanize(answers.project.primaryType));
  if (answers.project.addOns.length > 0) {
    project.push({
      label: 'Add-ons',
      value: answers.project.addOns.map((item) => addOnLabels.get(item) ?? humanize(item)).join(', ')
    });
  }
  addRow(project, 'Other requested addition', answers.project.otherAddOn);

  const needs: SummaryRow[] = [];
  addRow(needs, 'Goals', answers.needs.goals);
  addRow(needs, 'Other goal', answers.needs.otherGoal);
  addRow(needs, 'Pages', answers.needs.pages);
  addRow(needs, 'Other page', answers.needs.otherPage);
  addRow(needs, 'Features', answers.needs.features);
  addRow(needs, 'Other feature', answers.needs.otherFeature);
  const branchRows: Array<[string, unknown]> = [
    ['Current website', answers.needs.redesign.websiteUrl],
    ['Current platform', answers.needs.redesign.platform],
    ['What works well', answers.needs.redesign.worksWell],
    ['What needs to change', answers.needs.redesign.changeMost],
    ['Broken or blocked actions', answers.needs.redesign.brokenIssues],
    ['Product count', answers.needs.store.productCount],
    ['Product categories', answers.needs.store.categoryCount],
    ['Product types', answers.needs.store.productTypes],
    ['Product variations', answers.needs.store.variations],
    ['Shipping', answers.needs.store.shipping],
    ['Local delivery', answers.needs.store.localDelivery],
    ['Local pickup', answers.needs.store.localPickup],
    ['Inventory tracking', answers.needs.store.inventory],
    ['Process to improve', answers.needs.customTool.processToImprove],
    ['Current process', answers.needs.customTool.currentProcess],
    ['Tool users', answers.needs.customTool.users],
    ['Expected output', answers.needs.customTool.outputs],
    ['Biggest process problem', answers.needs.customTool.biggestProblem],
    ['Successful everyday use', answers.needs.customTool.successLooksLike],
    ['Support help needed', answers.needs.support.helpTypes],
    ['Support urgency', answers.needs.support.urgency],
    ['Current website issue', answers.needs.support.currentIssue],
    ['Needed support result', answers.needs.support.desiredResult],
    ['What should improve online', answers.needs.notSure.improveOnline],
    ['Current problem', answers.needs.notSure.currentProblem],
    ['Desired customer or staff action', answers.needs.notSure.desiredCapabilities],
    ['Booking type', answers.needs.booking.mode],
    ['Appointments or services', answers.needs.booking.services],
    ['Payment purposes', answers.needs.payments.purposes],
    ['Form audience', answers.needs.customForms.audience],
    ['Form information', answers.needs.customForms.information],
    ['After form submission', answers.needs.customForms.afterSubmit],
    ['Maintenance cadence', answers.needs.maintenance.cadence],
    ['Update frequency', answers.needs.maintenance.frequency]
  ];
  for (const [label, value] of branchRows) addRow(needs, label, value);

  const materials: SummaryRow[] = [];
  addRow(materials, 'Available materials', answers.materials.available);
  addRow(materials, 'Visual direction', answers.materials.visualWords);
  addRow(materials, 'Custom visual word', answers.materials.customVisualWord);
  addRow(materials, 'Brand elements to keep', answers.materials.brandMustRemain);
  addRow(materials, 'Styles to avoid', answers.materials.avoid);
  addRow(materials, 'Liked websites', answers.materials.likedSites);
  addRow(materials, 'What they like', answers.materials.likedReasons);
  addRow(materials, 'Disliked websites', answers.materials.dislikedSites);
  addRow(materials, 'What they dislike', answers.materials.dislikedReasons);


  const contact: SummaryRow[] = [];
  addRow(contact, 'Preferred contact', answers.contact.preferredMethod);
  addRow(contact, 'Best time', answers.contact.preferredTime);
  addRow(contact, 'Time zone', answers.contact.timeZone);
  addRow(contact, 'Social account', answers.contact.socialAccount);
  addRow(contact, 'Additional information', answers.contact.additionalInfo);
  addRow(contact, 'How they heard about Calypso', answers.contact.referralSource);

  return [
    { title: 'Business', rows: business },
    { title: 'Project', rows: project },
    { title: 'Needs', rows: needs },
    { title: 'Materials', rows: materials },
    { title: 'Contact', rows: contact }
  ];
}

function summaryText(sections: SummarySection[]): string {
  return sections.map((section) => [
    section.title,
    ...section.rows.map((row) => `${row.label}: ${row.value}`)
  ].join('\n')).join('\n\n');
}

function summaryHtml(sections: SummarySection[]): string {
  return sections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      <dl>${section.rows.map((row) => `<dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd>`).join('')}</dl>
    </section>`).join('');
}

export function formatOwnerEmail(intake: NormalizedIntake): EmailContent {
  const projectLabel = primaryLabels.get(intake.answers.project.primaryType as never) ?? humanize(intake.answers.project.primaryType);
  const sections = buildSummarySections(intake);
  return {
    subject: `New project inquiry | ${intake.answers.business.businessName} | ${projectLabel} | ${intake.reference}`,
    replyTo: intake.answers.business.email,
    text: `Reference: ${intake.reference}\n\n${summaryText(sections)}`,
    html: `<main><h1>New project inquiry</h1><p><strong>Reference:</strong> ${escapeHtml(intake.reference)}</p>${summaryHtml(sections)}</main>`
  };
}

export function formatClientEmail(intake: NormalizedIntake): EmailContent {
  const sections = buildSummarySections(intake);
  const intro = 'Calypso Digital Studio received your project details and will review them within two to three business days. No quote has been generated. Submitting this request does not commit you to purchasing services.';
  return {
    subject: `Calypso Digital Studio received your project details | ${intake.reference}`,
    replyTo: 'calydigital@outlook.com',
    text: `${intro}\n\nReference: ${intake.reference}\n\n${summaryText(sections)}`,
    html: `<main><h1>Your project details have been received.</h1><p>${escapeHtml(intro)}</p><p><strong>Reference:</strong> ${escapeHtml(intake.reference)}</p>${summaryHtml(sections)}</main>`
  };
}
