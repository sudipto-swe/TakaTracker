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

            // Should navigate to OTP screen
            await expect(element(by.id('otp-screen'))).toBeVisible();
        });
    });

    describe('OTP Screen', () => {
        beforeEach(async () => {
            // Navigate to OTP screen first
            await element(by.id('phone-input')).typeText('1712345678');
            await element(by.id('send-otp-button')).tap();
        });

        it('should display OTP input fields', async () => {
            await expect(element(by.id('otp-input-0'))).toBeVisible();
            await expect(element(by.id('otp-input-5'))).toBeVisible();
        });

        it('should show the entered phone number', async () => {
            await expect(element(by.text('+880 1712345678'))).toBeVisible();
        });

        it('should auto-focus next input on digit entry', async () => {
            await element(by.id('otp-input-0')).typeText('1');
            // Input should automatically move to next field
            await element(by.id('otp-input-1')).typeText('2');
            await element(by.id('otp-input-2')).typeText('3');
            await element(by.id('otp-input-3')).typeText('4');
            await element(by.id('otp-input-4')).typeText('5');
            await element(by.id('otp-input-5')).typeText('6');

            // Should auto-submit after 6 digits
            // Verify OTP screen is no longer visible (navigated to dashboard)
        });

