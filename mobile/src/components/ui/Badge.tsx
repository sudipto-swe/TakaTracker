/**
 * Badge component for status indicators.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';

interface BadgeProps {
    label: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary';
    size?: 'sm' | 'md';
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'default',
    size = 'md',
    style,
}) => {
    const getColors = (): { bg: string; text: string } => {
        switch (variant) {
            case 'success':
                return { bg: '#DCFCE7', text: '#166534' };
            case 'warning':
                return { bg: '#FEF3C7', text: '#92400E' };
            case 'error':
                return { bg: '#FEE2E2', text: '#991B1B' };
            case 'info':
                return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'primary':
                return { bg: '#E0E7FF', text: '#3730A3' };
            default:
                return { bg: COLORS.gray200, text: COLORS.gray700 };
        }
    };

    const colors = getColors();

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: colors.bg,
                    paddingHorizontal: size === 'sm' ? SPACING.sm : SPACING.md,
                    paddingVertical: size === 'sm' ? 2 : SPACING.xs,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: colors.text,
                        fontSize: size === 'sm' ? FONT_SIZES.xs : FONT_SIZES.sm,
                    },
                ]}
            >
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        borderRadius: BORDER_RADIUS.full,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
    },
});

export default Badge;
