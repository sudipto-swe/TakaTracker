/**
 * Common Button component with consistent styling.
 */
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    style,
    textStyle,
    testID,
}) => {
    const getButtonStyle = (): ViewStyle => {
        const base: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BORDER_RADIUS.md,
        };

        // Size
        switch (size) {
            case 'sm':
                base.paddingHorizontal = SPACING.md;
                base.paddingVertical = SPACING.sm;
                break;
            case 'lg':
                base.paddingHorizontal = SPACING.xl;
                base.paddingVertical = SPACING.lg;
                break;
            default:
                base.paddingHorizontal = SPACING.lg;
                base.paddingVertical = SPACING.md;
        }

        // Variant
        switch (variant) {
            case 'secondary':
                base.backgroundColor = COLORS.secondary;
                break;
            case 'outline':
                base.backgroundColor = 'transparent';
                base.borderWidth = 1.5;
                base.borderColor = COLORS.primary;
                break;
            case 'ghost':
                base.backgroundColor = 'transparent';
                break;
            case 'danger':
                base.backgroundColor = COLORS.error;
                break;
            default:
                base.backgroundColor = COLORS.primary;
        }

        if (disabled || loading) {
            base.opacity = 0.6;
        }

        if (fullWidth) {
            base.width = '100%';
        }

        return base;
    };

    const getTextStyle = (): TextStyle => {
        const base: TextStyle = {
            fontWeight: '600',
        };

        // Size
        switch (size) {
            case 'sm':
                base.fontSize = FONT_SIZES.sm;
                break;
            case 'lg':
                base.fontSize = FONT_SIZES.lg;
                break;
            default:
                base.fontSize = FONT_SIZES.md;
        }

        // Variant
        switch (variant) {
            case 'outline':
            case 'ghost':
                base.color = COLORS.primary;
                break;
            default:
                base.color = COLORS.white;
        }

        return base;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[getButtonStyle(), style]}
            activeOpacity={0.7}
            testID={testID}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
                    size="small"
                />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text style={[getTextStyle(), icon ? { marginLeft: SPACING.sm } : undefined, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

export default Button;
