/**
 * Forgot Password Screen — Enter phone to receive OTP for password reset.
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';

type ForgotPasswordNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ForgotPasswordNavigationProp>();
    const { isPhoneRegistered } = useAuthStore();
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async () => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
            setError('সঠিক ফোন নম্বর দিন (01XXXXXXXXX)');
            return;
        }

        if (!isPhoneRegistered(cleanPhone)) {
            setError(t('auth.accountNotFound'));
            return;
        }

        setIsLoading(true);
        setError('');

        // Simulate sending OTP
        setTimeout(() => {
            setIsLoading(false);
            navigation.navigate('OTP', {
                phone: cleanPhone,
                purpose: 'forgot-password',
            });
        }, 1000);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Back */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← {t('common.back')}</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
                    <Text style={styles.subtitle}>
                        আপনার রেজিস্ট্রেশন করা ফোন নম্বর দিন। আমরা একটি OTP পাঠাব।
                    </Text>
                </View>

                {/* Phone Input */}
                <View style={styles.form}>
                    <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
                    <View style={styles.phoneInputContainer}>
                        <View style={styles.countryCode}>
                            <Text style={styles.countryCodeText}>+88</Text>
                        </View>
                        <TextInput
                            style={styles.phoneInput}
                            value={phone}
                            onChangeText={(text) => { setPhone(text); setError(''); }}
                            placeholder="01XXXXXXXXX"
                            placeholderTextColor={COLORS.gray400}
                            keyboardType="phone-pad"
                            maxLength={11}
                            autoFocus
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSendOTP}
                        disabled={isLoading || phone.length < 11}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.sendOtp')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Back to Login */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>← {t('auth.login')}</Text>
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
    backButton: {
        marginBottom: SPACING.xl,
    },
    backButtonText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.primary,
        fontWeight: '500',
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
    form: {
        marginBottom: SPACING.xl,
    },
    label: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
    },
    countryCode: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: BORDER_RADIUS.md,
        borderBottomLeftRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRightWidth: 0,
    },
    countryCodeText: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.lg,
        borderTopRightRadius: BORDER_RADIUS.md,
        borderBottomRightRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        color: COLORS.textPrimary,
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
    footer: {
        alignItems: 'center',
    },
    footerLink: {
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
        fontWeight: '600',
    },
});