/**
 * OTP Verification Screen.
 * Handles both registration and forgot-password flows.
 */
import React, { useState, useRef, useEffect } from 'react';
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

import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';
import { APP_CONFIG } from '../../constants/config';

type OTPScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OTP'>;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTP'>;

export const OTPScreen: React.FC = () => {
    const navigation = useNavigation<OTPScreenNavigationProp>();
    const route = useRoute<OTPScreenRouteProp>();
    const { phone, purpose, name, businessName, password } = route.params;

    const { registerUser } = useAuthStore();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(APP_CONFIG.OTP_RESEND_DELAY_SECONDS);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            value = value.slice(-1);
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (value && index === 5) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                handleVerify(fullOtp);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (otpCode?: string) => {
        const code = otpCode || otp.join('');
        if (code.length !== 6) {
            setError('৬ সংখ্যার OTP দিন');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Simulate OTP verification
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (purpose === 'register') {
                // Register the user with password
                registerUser(
                    {
                        id: 'user_' + Date.now(),
                        phone,
                        name: name || '',
                        businessName: businessName || '',
                        role: 'merchant',
                        language: 'bn',
                        isVerified: true,
                    },
                    password || ''
                );
                // registerUser auto-logs in, so we're done
            } else if (purpose === 'forgot-password') {
                // Navigate to reset password screen
                setIsLoading(false);
                navigation.navigate('ResetPassword', { phone });
            }
        } catch (err) {
            setIsLoading(false);
            setError('OTP যাচাই ব্যর্থ হয়েছে');
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setResendTimer(APP_CONFIG.OTP_RESEND_DELAY_SECONDS);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Header */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← {t('common.back')}</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>{t('auth.enterOtp')}</Text>
                    <Text style={styles.subtitle}>
                        +88{phone} নম্বরে OTP পাঠানো হয়েছে
                    </Text>
                </View>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : null,
                                error ? styles.otpInputError : null,
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Verify Button */}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={() => handleVerify()}
                    disabled={isLoading || otp.join('').length !== 6}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.buttonText}>{t('auth.verifyOtp')}</Text>
                    )}
                </TouchableOpacity>

                {/* Resend */}
                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>OTP পাননি? </Text>
                    <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
                        <Text style={[
                            styles.resendLink,
                            resendTimer > 0 && styles.resendLinkDisabled
                        ]}>
                            {resendTimer > 0
                                ? `${resendTimer}s পরে আবার পাঠান`
                                : t('auth.resendOtp')
                            }
                        </Text>
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
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    otpInput: {
        width: 50,
        height: 56,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.white,
        textAlign: 'center',
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    otpInputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.gray50,
    },
    otpInputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.sm,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        marginBottom: SPACING.xl,
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
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    resendText: {
        fontSize: FONT_SIZES.base,
        color: COLORS.textSecondary,
    },
    resendLink: {
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
        fontWeight: '600',
    },
    resendLinkDisabled: {
        color: COLORS.gray400,
    },
});