/**
 * Card component with consistent styling.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
    onPress?: () => void;
    testID?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    onPress,
    testID,
}) => {
    const getCardStyle = (): ViewStyle => {
        const base: ViewStyle = {
            backgroundColor: COLORS.surface,
            borderRadius: BORDER_RADIUS.md,
            padding: SPACING.base,
        };

        switch (variant) {
            case 'elevated':
                return { ...base, ...SHADOWS.md };
            case 'outlined':
                return { ...base, borderWidth: 1, borderColor: COLORS.gray200 };
            default:
                return { ...base, ...SHADOWS.sm };
        }
    };

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[getCardStyle(), style]}
                testID={testID}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={[getCardStyle(), style]} testID={testID}>
            {children}
        </View>
    );
};

export default Card;
