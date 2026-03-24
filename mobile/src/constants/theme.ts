/**
 * Theme constants for TakaTracker app.
 * Colors inspired by modern fintech apps with Bangladesh market considerations.
 */

export const COLORS = {
    // Primary - Deep blue for trust & reliability
    primary: '#1E3A5F',
    primaryLight: '#2E5A8F',
    primaryDark: '#0E2A4F',

    // Secondary - Vibrant green for money/growth
    secondary: '#00A86B',
    secondaryLight: '#00C87B',
    secondaryDark: '#008A5B',

    // Accent - Orange for call-to-action
    accent: '#FF6B35',
    accentLight: '#FF8B55',
    accentDark: '#E55B25',

    // Status colors
    success: '#00C853',
    warning: '#FFB300',
    error: '#FF3D00',
    info: '#2196F3',

    // Due status
    receivable: '#4CAF50',  // Green - they owe us (পাওনা)
    payable: '#F44336',     // Red - we owe them (দেনা)

    // Neutral
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',

    // Background
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',

    // Text
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
};

export const FONTS = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    bengali: 'NotoSansBengali_400Regular',
    bengaliBold: 'NotoSansBengali_700Bold',
};

export const FONT_SIZES = {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
};

export const BORDER_RADIUS = {
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    base: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
};
