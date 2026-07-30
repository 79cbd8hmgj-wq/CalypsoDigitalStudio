import { describe, expect, test } from 'vitest';
import { clearIrrelevantNeeds, deriveConditions, requiredPathsFor } from '../../src/lib/intake/conditions';
import { createValidWebsiteSubmission } from './fixtures';

describe('deriveConditions', () => {
  test('shows store fields for an online store or product-sales add-on', () => {
    const request = createValidWebsiteSubmission();
    request.answers.project.primaryType = 'online-store';
    expect(deriveConditions(request.answers).showStore).toBe(true);

    request.answers.project.primaryType = 'new-website';
    request.answers.project.addOns = ['product-sales'];
    expect(deriveConditions(request.answers).showStore).toBe(true);
  });

  test('activates only the matching primary project branch', () => {
    const request = createValidWebsiteSubmission();
    request.answers.project.primaryType = 'custom-tool';
    const conditions = deriveConditions(request.answers);
    expect(conditions.showCustomTool).toBe(true);
    expect(conditions.showRedesign).toBe(false);
    expect(conditions.showSupport).toBe(false);
    expect(conditions.showNotSure).toBe(false);
  });

  test('derives contact and other-add-on requirements without budget paths', () => {
    const request = createValidWebsiteSubmission();
    request.answers.contact.preferredMethod = 'text';
    request.answers.project.addOns = ['other'];
    const conditions = deriveConditions(request.answers);
    const required = requiredPathsFor(request.answers);
    expect(conditions.requirePhone).toBe(true);
    expect(conditions.requireOtherAddOn).toBe(true);
    expect(required).toContain('business.phone');
    expect(required).toContain('project.otherAddOn');
    expect(required.some((path) => path.startsWith('budgetAndTiming.'))).toBe(false);
  });
});

test('clears values belonging to inactive conditional branches', () => {
  const request = createValidWebsiteSubmission();
  request.answers.needs.store.productCount = '11-25';
  request.answers.needs.customTool.processToImprove = 'Old process';
  request.answers.needs.booking.services = 'Portrait sessions';
  request.answers.project.primaryType = 'new-website';
  request.answers.project.addOns = [];

  const cleared = clearIrrelevantNeeds(request.answers);
  expect(cleared.store.productCount).toBe('');
  expect(cleared.customTool.processToImprove).toBe('');
  expect(cleared.booking.services).toBe('');
  expect(cleared.pages).toEqual(request.answers.needs.pages);
});
