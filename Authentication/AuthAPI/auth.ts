/**
 * Authentication API service.
 */
import apiClient, { ApiResponse, setAuthToken, clearAuthToken } from './client';

interface OTPRequestResponse {
    success: boolean;
    message: string;
    message_bn: string;
}

interface OTPVerifyResponse {
    access: string;
    refresh: string;
    user: {
        id: string;
        phone: string;
        name: string;
        business_name: string;
        role: string;
        language: string;
        is_verified: boolean;
    };
}

interface UserProfile {
    id: string;
    phone: string;
    name: string;
    business_name: string;
    business_type: string;
    address: string;
    profile_image: string;
    role: string;
    language: string;
}

export const authService = {
    /**
     * Request OTP for phone number.
     */
    requestOTP: async (phone: string): Promise<ApiResponse<OTPRequestResponse>> => {
        try {
            const response = await apiClient.post('/users/auth/otp/request/', { phone });
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'OTP request failed',
            };
        }
    },

    /**
     * Verify OTP and get tokens.
     */
    verifyOTP: async (phone: string, otp: string): Promise<ApiResponse<OTPVerifyResponse>> => {
        try {
            const response = await apiClient.post('/users/auth/otp/verify/', { phone, otp });
            const data = response.data;

            // Save tokens
            await setAuthToken(data.access, data.refresh);

            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'OTP verification failed',
            };
        }
    },

    /**
     * Register new user after OTP verification.
     */
    register: async (userData: {
        phone: string;
        name: string;
        business_name?: string;
        business_type?: string;
        language?: string;
    }): Promise<ApiResponse<OTPVerifyResponse>> => {
        try {
            const response = await apiClient.post('/users/auth/register/', userData);
            const data = response.data;

            await setAuthToken(data.access, data.refresh);

            return { success: true, data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed',
            };
        }
    },

    /**
     * Get current user profile.
     */
    getProfile: async (): Promise<ApiResponse<UserProfile>> => {
        try {
            const response = await apiClient.get('/users/profile/');
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get profile',
            };
        }
    },

    /**
     * Update user profile.
     */
    updateProfile: async (updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
        try {
            const response = await apiClient.patch('/users/profile/', updates);
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update profile',
            };
        }
    },

    /**
     * Change app language.
     */
    changeLanguage: async (language: 'bn' | 'en'): Promise<ApiResponse<any>> => {
        try {
            const response = await apiClient.post('/users/profile/language/', { language });
            return { success: true, data: response.data };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to change language',
            };
        }
    },

    /**
     * Logout and clear tokens.
     */
    logout: async (): Promise<void> => {
        await clearAuthToken();
    },
};