/**
 * Register Screen — Sign up with name, business, phone, and password.
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
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<RegisterScreenNavigationProp>();
    const { isPhoneRegistered } = useAuthStore();
    const [name, setName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Password strength checks
    const pwChecks = {
        minLength: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-={}|;':",./<>?]/.test(password),
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
    const strength = password.length > 0 ? getStrengthLabel() : null;

    const handleRegister = async () => {
        if (!name.trim()) {
            setError(t('auth.enterName'));
            return;
        }
        if (!businessName.trim()) {
            setError(t('auth.enterBusinessName'));
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
            setError('সঠিক ফোন নম্বর দিন (01XXXXXXXXX)');
            return;
        }
        if (!isStrongPassword) {
            setError('শক্তিশালী পাসওয়ার্ড দিন — সব শর্ত পূরণ করুন');
            return;
        }
        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }

        // Check if already registered
        if (isPhoneRegistered(cleanPhone)) {
            setError(t('auth.haveAccount'));
            return;
        }

        setIsLoading(true);
        setError('');

        // Simulate sending OTP
        setTimeout(() => {
            setIsLoading(false);
            navigation.navigate('OTP', {
                phone: cleanPhone,
                purpose: 'register',
                name: name.trim(),
                businessName: businessName.trim(),
                password: password,
            });
        }, 1000);
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
                    <Text style={styles.title}>{t('auth.createAccount')}</Text>
                    <Text style={styles.tagline}>আপনার ডিজিটাল হিসাব খাতা</Text>
                </View>

                {/* Registration Form */}
                <View style={styles.form}>
                    {/* Name */}
                    <Text style={styles.label}>{t('auth.yourName')}</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={(text) => { setName(text); setError(''); }}
                        placeholder={t('auth.enterName')}
                        placeholderTextColor={COLORS.gray400}
                        autoFocus
                    />

                    {/* Business Name */}
                    <Text style={styles.label}>{t('auth.businessName')}</Text>
                    <TextInput
                        style={styles.input}
                        value={businessName}
                        onChangeText={(text) => { setBusinessName(text); setError(''); }}
                        placeholder={t('auth.enterBusinessName')}
                        placeholderTextColor={COLORS.gray400}
                    />

                    {/* Phone Number */}
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

                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                        <View style={styles.strengthContainer}>
                            {/* Strength Bar */}
                            <View style={styles.strengthBarBg}>
                                <View style={[
                                    styles.strengthBarFill,
                                    { width: `${(pwScore / 5) * 100}%`, backgroundColor: strength?.color || COLORS.gray300 }
                                ]} />
                            </View>
                            <Text style={[styles.strengthLabel, { color: strength?.color }]}>
                                {strength?.label}
                            </Text>

                            {/* Requirement Checklist */}
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

                    {/* Confirm Password */}
                    <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
                        placeholder={t('auth.confirmPassword')}
                        placeholderTextColor={COLORS.gray400}
                        secureTextEntry={!showPassword}
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.signUp')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Login Link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('auth.haveAccount')} </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>{t('auth.login')}</Text>
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
        paddingVertical: SPACING['2xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoContainer: {
        width: 140,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    logoImage: {
        width: 140,
        height: 100,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    tagline: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    form: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.base,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
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
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.base,
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
        marginBottom: SPACING.md,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
    },
    eyeButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.sm,
        marginBottom: SPACING.md,
    },
    button: {
        backgroundColor: COLORS.secondary,
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: FONT_SIZES.base,
        color: COLORS.textSecondary,
    },
    footerLink: {
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
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
        overflow: 'hidden',
        marginBottom: SPACING.xs,
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    checklistContainer: {
        backgroundColor: COLORS.gray100,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: 2,
    },
    checkText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
    },
});