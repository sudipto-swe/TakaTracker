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
