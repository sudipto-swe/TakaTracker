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
