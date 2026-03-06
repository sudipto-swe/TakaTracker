/**
 * Reset Password Screen — Set a new password after OTP verification.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';

type ResetPasswordNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ResetPasswordNavigationProp>();
    const route = useRoute<ResetPasswordRouteProp>();
    const { phone } = route.params;

    const { resetPassword } = useAuthStore();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Password strength checks
    const pwChecks = {
        minLength: newPassword.length >= 8,
        hasUpper: /[A-Z]/.test(newPassword),
        hasLower: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[!@#$%^&*()_+\-={}|;':",./<>?]/.test(newPassword),
    };
    const pwScore = Object.values(pwChecks).filter(Boolean).length;
    const isStrongPassword = pwScore === 5;
    const getStrengthLabel = () => {
        if (pwScore <= 1) return { label: 'দুর্বল', color: COLORS.error };
        if (pwScore <= 2) return { label: 'মোটামুটি', color: '#FF8C00' };
        if (pwScore <= 3) return { label: 'ভালো', color: COLORS.warning };
        if (pwScore === 4) return { label: 'শক্তিশালী', color: '#32CD32' };
        return { label: 'অতি শক্তিশালী', color: COLORS.success };
    };
    const strength = newPassword.length > 0 ? getStrengthLabel() : null;

    const handleResetPassword = async () => {
        if (!isStrongPassword) {
            setError('শক্তিশালী পাসওয়ার্ড দিন — সব শর্ত পূরণ করুন');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }

        setIsLoading(true);
        setError('');

        setTimeout(() => {
            const success = resetPassword(phone, newPassword);
            setIsLoading(false);

            if (success) {
                Alert.alert(
                    '✅',
                    t('auth.passwordResetSuccess'),
                    [
                        {
                            text: t('auth.login'),
                            onPress: () => navigation.navigate('Login'),
                        },
                    ]
                );
            } else {
                setError(t('auth.accountNotFound'));
            }
        }, 800);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t('auth.resetPassword')}</Text>
                    <Text style={styles.subtitle}>
                        +88{phone} নম্বরের জন্য নতুন পাসওয়ার্ড সেট করুন
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* New Password */}
                    <Text style={styles.label}>{t('auth.newPassword')}</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={newPassword}
                            onChangeText={(text) => { setNewPassword(text); setError(''); }}
                            placeholder={t('auth.newPassword')}
                            placeholderTextColor={COLORS.gray400}
                            secureTextEntry={!showPassword}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={22}
                                color={COLORS.gray500}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBarBg}>
                                <View style={[
                                    styles.strengthBarFill,
                                    { width: `${(pwScore / 5) * 100}%`, backgroundColor: strength?.color || COLORS.gray300 }
                                ]} />
                            </View>
                            <Text style={[styles.strengthLabel, { color: strength?.color }]}>
                                {strength?.label}
                            </Text>
                            <View style={styles.checklistContainer}>
                                {[
                                    { check: pwChecks.minLength, text: 'কমপক্ষে ৮ অক্ষর' },
                                    { check: pwChecks.hasUpper, text: 'বড় হাতের অক্ষর (A-Z)' },
                                    { check: pwChecks.hasLower, text: 'ছোট হাতের অক্ষর (a-z)' },
                                    { check: pwChecks.hasNumber, text: 'সংখ্যা (0-9)' },
                                    { check: pwChecks.hasSpecial, text: 'বিশেষ চিহ্ন (!@#$%...)' },
                                ].map((item, i) => (
                                    <View key={i} style={styles.checkItem}>
                                        <Ionicons
                                            name={item.check ? 'checkmark-circle' : 'ellipse-outline'}
                                            size={16}
                                            color={item.check ? COLORS.success : COLORS.gray400}
                                        />
                                        <Text style={[
                                            styles.checkText,
                                            item.check && { color: COLORS.success }
                                        ]}>
                                            {item.text}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Confirm New Password */}
                    <Text style={styles.label}>{t('auth.confirmNewPassword')}</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
                        placeholder={t('auth.confirmNewPassword')}
                        placeholderTextColor={COLORS.gray400}
                        secureTextEntry={!showPassword}
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.resetPassword')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING['3xl'],
    },
    header: {
        marginBottom: SPACING['2xl'],
    },
    title: {
        fontSize: FONT_SIZES['2xl'],
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZES.base,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    form: {},
    label: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.base,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        marginBottom: SPACING.lg,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
    },
    eyeButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.sm,
        marginBottom: SPACING.md,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        ...SHADOWS.base,
    },
    buttonDisabled: {
        backgroundColor: COLORS.gray400,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    strengthContainer: {
        marginBottom: SPACING.md,
        marginTop: -SPACING.xs,
    },
    strengthBarBg: {
        height: 4,
        backgroundColor: COLORS.gray200,
        borderRadius: 2,
        overflow: 'hidden' as const,
        marginBottom: SPACING.xs,
    },
    strengthBarFill: {
        height: '100%' as any,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '600' as const,
        marginBottom: SPACING.sm,
    },
    checklistContainer: {
        backgroundColor: COLORS.gray100,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
    },
    checkItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: SPACING.xs,
        paddingVertical: 2,
    },
    checkText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
    },
});