/**
 * Login Screen — Phone + Password Authentication.
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
    Image,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { loginUser } = useAuthStore();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
            setError('সঠিক ফোন নম্বর দিন (01XXXXXXXXX)');
            return;
        }
        if (password.length < 6) {
            setError(t('auth.passwordTooShort'));
            return;
        }

        setIsLoading(true);
        setError('');

        // Simulate network delay
        setTimeout(() => {
            const result = loginUser(cleanPhone, password);
            setIsLoading(false);

            if (!result.success) {
                if (result.error === 'accountNotFound') {
                    setError(t('auth.accountNotFound'));
                } else if (result.error === 'wrongPassword') {
                    setError(t('auth.wrongPassword'));
                }
            }
        }, 800);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Logo & Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../assets/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>
                    <Text style={styles.tagline}>{t('auth.loginToContinue')}</Text>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                    {/* Phone */}
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
                        />
                    </View>

                    {/* Password */}
                    <Text style={styles.label}>{t('auth.password')}</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={password}
                            onChangeText={(text) => { setPassword(text); setError(''); }}
                            placeholder={t('auth.enterPassword')}
                            placeholderTextColor={COLORS.gray400}
                            secureTextEntry={!showPassword}
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

                    {/* Forgot Password */}
                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                    </TouchableOpacity>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        লগইন করে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন
                    </Text>
                </View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>{t('auth.noAccount')} </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.signupLink}>{t('auth.signUp')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
        paddingVertical: SPACING['3xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    logoContainer: {
        width: 200,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    logoImage: {
        width: 200,
        height: 160,
    },
    welcomeText: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    tagline: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        marginBottom: SPACING.sm,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: SPACING.lg,
    },
    forgotPasswordText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
        fontWeight: '500',
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
    footerText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    signupText: {
        fontSize: FONT_SIZES.base,
        color: COLORS.textSecondary,
    },
    signupLink: {
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
        fontWeight: '600',
    },
});