/**
 * Auth Store Unit Tests
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../../store/authStore';

describe('AuthStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const { result } = renderHook(() => useAuthStore());

            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('setUser', () => {
        it('should set user and mark as authenticated', () => {
            const { result } = renderHook(() => useAuthStore());

            const mockUser = {
                id: '1',
                phone: '+8801712345678',
                name: 'Test User',
                businessName: 'Test Business',
            };

            act(() => {
                result.current.setUser(mockUser);
            });

            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
        });
    });

    describe('setToken', () => {
        it('should set token correctly', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setToken('test-token-123');
            });

            expect(result.current.token).toBe('test-token-123');
        });
    });

    describe('logout', () => {
        it('should clear user, token, and set isAuthenticated to false', () => {
            const { result } = renderHook(() => useAuthStore());

            // First login
            act(() => {
                result.current.setUser({ id: '1', phone: '+8801712345678' });
                result.current.setToken('test-token');
            });

            expect(result.current.isAuthenticated).toBe(true);

            // Then logout
            act(() => {
                result.current.logout();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('setLoading', () => {
        it('should set loading state', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLoading(true);
            });

            expect(result.current.isLoading).toBe(true);

            act(() => {
                result.current.setLoading(false);
            });

            expect(result.current.isLoading).toBe(false);
        });
    });
});
