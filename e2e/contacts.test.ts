/**
 * Contacts Flow E2E Tests
 * Tests customer and supplier management.
 */
import { by, device, element, expect, waitFor } from 'detox';

describe('Contacts Management', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true,
            launchArgs: { detoxUserLoggedIn: true }
        });
    });

    beforeEach(async () => {
        await device.reloadReactNative();
        // Navigate to Contacts tab
        await element(by.id('tab-contacts')).tap();
    });

    describe('Contact List', () => {
        it('should display contacts screen with tabs', async () => {
            await expect(element(by.id('contacts-screen'))).toBeVisible();
            await expect(element(by.id('tab-customers'))).toBeVisible();
            await expect(element(by.id('tab-suppliers'))).toBeVisible();
        });

        it('should show dues summary', async () => {
            await expect(element(by.id('total-receivable'))).toBeVisible();
            await expect(element(by.id('total-payable'))).toBeVisible();
        });

        it('should switch between customers and suppliers', async () => {
            await element(by.id('tab-suppliers')).tap();
            await expect(element(by.id('suppliers-list'))).toBeVisible();

            await element(by.id('tab-customers')).tap();
            await expect(element(by.id('customers-list'))).toBeVisible();
        });

        it('should search contacts', async () => {
            await element(by.id('contacts-search-input')).typeText('টেস্ট');

            await waitFor(element(by.id('contact-list')))
                .toBeVisible()
                .withTimeout(3000);
        });
    });

    describe('Add Contact', () => {
        it('should open add contact form', async () => {
            await element(by.id('add-contact-button')).tap();

            await expect(element(by.id('add-contact-screen'))).toBeVisible();
        });
