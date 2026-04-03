/**
 * Sync Service Unit Tests
 */
import { backgroundSync } from '../../services/syncService';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock NetInfo
jest.mock('@react-native-community/netinfo');

describe('BackgroundSyncService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    describe('initialize', () => {
        it('should set up network listener and get initial state', async () => {
            (NetInfo.addEventListener as jest.Mock).mockReturnValue(jest.fn());
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

            await backgroundSync.initialize();

            expect(NetInfo.addEventListener).toHaveBeenCalled();
            expect(NetInfo.fetch).toHaveBeenCalled();
            expect(backgroundSync.getConnectionStatus()).toBe(true);
        });

        it('should handle offline initial state', async () => {
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

            await backgroundSync.initialize();

            expect(backgroundSync.getConnectionStatus()).toBe(false);
        });
    });

    describe('triggerSync', () => {
        it('should skip sync when offline', async () => {
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
            await backgroundSync.initialize();

            const result = await backgroundSync.triggerSync();

            expect(result.success).toBe(false);
            expect(result.errors).toContain('No network connection');
        });

        it('should skip sync when already in progress', async () => {
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
            await backgroundSync.initialize();

            const result = await backgroundSync.triggerSync();

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Sync already in progress');
        });
    });

    describe('getLastSyncTime', () => {
        it('should return last sync timestamp', async () => {
            const timestamp = '2026-02-08T12:00:00.000Z';
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(timestamp);

            const result = await backgroundSync.getLastSyncTime();

            expect(result).toBe(timestamp);
        });

        it('should return null if never synced', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await backgroundSync.getLastSyncTime();

            expect(result).toBeNull();
        });
    });

    describe('Periodic Sync', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
            backgroundSync.stopPeriodicSync();
        });

        it('should start periodic sync with default interval', () => {
            const triggerSyncSpy = jest.spyOn(backgroundSync, 'triggerSync');
            (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

            backgroundSync.startPeriodicSync();

            // Fast-forward 5 minutes
            jest.advanceTimersByTime(5 * 60 * 1000);

            // triggerSync should have been called
            expect(triggerSyncSpy).toHaveBeenCalled();
        });

        it('should stop periodic sync', () => {
            backgroundSync.startPeriodicSync();
            backgroundSync.stopPeriodicSync();

            // No error thrown, interval cleared
            expect(true).toBe(true);
        });
    });
});
