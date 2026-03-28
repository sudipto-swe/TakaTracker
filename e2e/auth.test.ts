/**
 * Authentication Flow E2E Tests
 * Tests the complete login → OTP → Dashboard flow.
 */
import { by, device, element, expect } from 'detox';

describe('Authentication Flow', () => {
    beforeAll(async () => {
        await device.launchApp({ newInstance: true });
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    describe('Login Screen', () => {
        it('should display the login screen', async () => {
            await expect(element(by.text('ট্যালিখাতা'))).toBeVisible();
            await expect(element(by.id('phone-input'))).toBeVisible();
            await expect(element(by.id('send-otp-button'))).toBeVisible();
        });

        it('should show error for invalid phone number', async () => {
            await element(by.id('phone-input')).typeText('123');
            await element(by.id('send-otp-button')).tap();

            await expect(element(by.text('সঠিক ফোন নম্বর দিন'))).toBeVisible();
        });

        it('should accept valid Bangladesh phone number', async () => {
            await element(by.id('phone-input')).clearText();
            await element(by.id('phone-input')).typeText('1712345678');
            await element(by.id('send-otp-button')).tap();
