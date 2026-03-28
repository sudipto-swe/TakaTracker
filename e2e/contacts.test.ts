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

        it('should add a new customer', async () => {
            await element(by.id('add-contact-button')).tap();

            // Fill in contact details
            await element(by.id('contact-name-input')).typeText('টেস্ট গ্রাহক');
            await element(by.id('contact-phone-input')).typeText('01712345678');
            await element(by.id('contact-address-input')).typeText('ঢাকা, বাংলাদেশ');

            // Select customer type
            await element(by.id('type-customer')).tap();

            // Save
            await element(by.id('save-contact-button')).tap();

            await expect(element(by.text('যোগাযোগ সংরক্ষিত হয়েছে'))).toBeVisible();
        });

        it('should add a new supplier', async () => {
            await element(by.id('add-contact-button')).tap();

            await element(by.id('contact-name-input')).typeText('টেস্ট সরবরাহকারী');
            await element(by.id('contact-phone-input')).typeText('01898765432');
            await element(by.id('type-supplier')).tap();
            await element(by.id('save-contact-button')).tap();

            await expect(element(by.text('যোগাযোগ সংরক্ষিত হয়েছে'))).toBeVisible();
        });

        it('should require name field', async () => {
            await element(by.id('add-contact-button')).tap();
            await element(by.id('save-contact-button')).tap();

            await expect(element(by.text('নাম দিন'))).toBeVisible();
        });
    });

    describe('Contact Detail', () => {
        it('should open contact detail on tap', async () => {
            await element(by.id('contact-item-0')).tap();

            await expect(element(by.id('contact-detail-screen'))).toBeVisible();
        });

        it('should show contact balance', async () => {
            await element(by.id('contact-item-0')).tap();

            await expect(element(by.id('contact-balance'))).toBeVisible();
        });

        it('should show transaction history for contact', async () => {
            await element(by.id('contact-item-0')).tap();

            await expect(element(by.id('contact-transactions-list'))).toBeVisible();
        });

        it('should allow adding transaction for contact', async () => {
            await element(by.id('contact-item-0')).tap();
            await element(by.id('add-transaction-for-contact')).tap();

            await expect(element(by.id('add-transaction-screen'))).toBeVisible();
            // Contact should be pre-selected
        });
    });
});
