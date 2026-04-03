/**
 * Common Input component with consistent styling.
 */
import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    required?: boolean;
    touched?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    containerStyle,
    required = false,
    touched = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const showError = touched && error;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    {required && <Text style={styles.required}>*</Text>}
                </View>
            )}

            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputFocused,
                    showError && styles.inputError,
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[
                        styles.input,
                        leftIcon ? styles.inputWithLeftIcon : undefined,
                        rightIcon ? styles.inputWithRightIcon : undefined,
                    ]}
                    placeholderTextColor={COLORS.gray500}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>

            {showError && <Text style={styles.error}>{error}</Text>}
            {hint && !showError && <Text style={styles.hint}>{hint}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    labelContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    required: {
        color: COLORS.error,
        marginLeft: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    input: {
        flex: 1,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.md,
        color: COLORS.textPrimary,
    },
    inputWithLeftIcon: {
        paddingLeft: SPACING.xs,
    },
    inputWithRightIcon: {
        paddingRight: SPACING.xs,
    },
    leftIcon: {
        paddingLeft: SPACING.md,
    },
    rightIcon: {
        paddingRight: SPACING.md,
    },
    error: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    hint: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
});

export default Input;
