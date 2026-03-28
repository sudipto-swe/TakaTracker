/**
 * Transaction Flow E2E Tests
 * Tests creating, viewing, and managing transactions.
 */
import { by, device, element, expect, waitFor } from 'detox';

describe('Transaction Management', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true,
            launchArgs: { detoxUserLoggedIn: true }
        });
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    describe('Transaction List', () => {
        it('should display transactions tab', async () => {
            await element(by.id('tab-transactions')).tap();
            await expect(element(by.id('transactions-screen'))).toBeVisible();
        });

        it('should show filter options', async () => {
            await element(by.id('tab-transactions')).tap();

            await expect(element(by.id('filter-all'))).toBeVisible();
            await expect(element(by.id('filter-sales'))).toBeVisible();
            await expect(element(by.id('filter-purchases'))).toBeVisible();
        });

        it('should filter transactions by type', async () => {
            await element(by.id('tab-transactions')).tap();
            await element(by.id('filter-sales')).tap();

            // Only sales should be visible
            // Check that filter is active
            await expect(element(by.id('filter-sales'))).toHaveLabel('active');
        });

        it('should search transactions', async () => {
            await element(by.id('tab-transactions')).tap();
            await element(by.id('search-input')).typeText('Test');

            // Should show filtered results
            await waitFor(element(by.id('transaction-list')))
                .toBeVisible()
                .withTimeout(3000);
        });
    });

    describe('Add Transaction', () => {
        beforeEach(async () => {
            // Navigate to Add Transaction
            await element(by.id('tab-add')).tap();
        });

        it('should display transaction type selection', async () => {
            await expect(element(by.id('add-transaction-screen'))).toBeVisible();
            await expect(element(by.id('type-sale'))).toBeVisible();
            await expect(element(by.id('type-purchase'))).toBeVisible();
            await expect(element(by.id('type-expense'))).toBeVisible();
        });

        it('should create a sale transaction', async () => {
            // Select sale type
            await element(by.id('type-sale')).tap();

            // Enter amount
            await element(by.id('amount-input')).typeText('1500');

            // Add notes
            await element(by.id('notes-input')).typeText('টেস্ট বিক্রয়');

            // Save transaction
            await element(by.id('save-transaction-button')).tap();

            // Should show success message
            await expect(element(by.text('লেনদেন সংরক্ষিত হয়েছে'))).toBeVisible();
        });

        it('should require amount field', async () => {
            await element(by.id('type-sale')).tap();
            await element(by.id('save-transaction-button')).tap();

            await expect(element(by.text('পরিমাণ দিন'))).toBeVisible();
        });

        it('should allow selecting a contact', async () => {
            await element(by.id('type-sale')).tap();
            await element(by.id('select-contact-button')).tap();

            // Contact picker should open
            await expect(element(by.id('contact-picker-modal'))).toBeVisible();
        });

        it('should calculate due amount', async () => {
            await element(by.id('type-sale')).tap();
            await element(by.id('amount-input')).typeText('1000');
            await element(by.id('paid-amount-input')).typeText('600');

            // Due amount should show 400
            await expect(element(by.id('due-amount'))).toHaveText('৳400');
        });
    });