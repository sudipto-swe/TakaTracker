/**
 * QR Payment Screen - Generate and display QR code for payments.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';

const PAYMENT_METHODS = [
    { key: 'bkash', name: 'বিকাশ', color: '#E2136E', icon: 'phone-portrait-outline' },
    { key: 'nagad', name: 'নগদ', color: '#F6921E', icon: 'phone-portrait-outline' },
    { key: 'rocket', name: 'রকেট', color: '#8C3494', icon: 'phone-portrait-outline' },
];

export const QRPaymentScreen: React.FC = () => {
    const navigation = useNavigation();
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [qrGenerated, setQrGenerated] = useState(false);

    const handleGenerateQR = () => {
        if (amount && selectedMethod) {
            setQrGenerated(true);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${formatCurrency(parseFloat(amount))} পেমেন্ট করুন। ${selectedMethod?.toUpperCase()} এ পাঠান।`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleReset = () => {
        setAmount('');
        setSelectedMethod(null);
        setQrGenerated(false);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('payments.qrPayment')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {!qrGenerated ? (
                    <>
                        {/* Amount Input */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('payments.enterAmount')}</Text>
                            <View style={styles.amountContainer}>
                                <Text style={styles.currencySymbol}>৳</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.gray300}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Payment Method Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('payments.selectGateway')}</Text>
                            <View style={styles.methodsGrid}>
                                {PAYMENT_METHODS.map(method => (
                                    <TouchableOpacity
                                        key={method.key}
                                        style={[
                                            styles.methodCard,
                                            selectedMethod === method.key && {
                                                borderColor: method.color,
                                                borderWidth: 2,
                                            }
                                        ]}
                                        onPress={() => setSelectedMethod(method.key)}
                                    >
                                        <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                                            <Ionicons name={method.icon as any} size={24} color={method.color} />
                                        </View>
                                        <Text style={styles.methodName}>{method.name}</Text>
                                        {selectedMethod === method.key && (
                                            <View style={[styles.checkMark, { backgroundColor: method.color }]}>
                                                <Ionicons name="checkmark" size={12} color={COLORS.white} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={[
                                styles.generateButton,
                                (!amount || !selectedMethod) && styles.generateButtonDisabled
                            ]}
                            onPress={handleGenerateQR}
                            disabled={!amount || !selectedMethod}
                        >
                            <Ionicons name="qr-code" size={24} color={COLORS.white} />
                            <Text style={styles.generateButtonText}>{t('payments.generateQr')}</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* QR Display */}
                        <View style={styles.qrContainer}>
                            <View style={styles.qrPlaceholder}>
                                <Ionicons name="qr-code" size={150} color={COLORS.primary} />
                                <Text style={styles.qrNote}>QR কোড এখানে দেখাবে</Text>
                            </View>
                            <Text style={styles.qrAmount}>{formatCurrency(parseFloat(amount))}</Text>
                            <View style={styles.methodBadge}>
                                <Text style={styles.methodBadgeText}>
                                    {PAYMENT_METHODS.find(m => m.key === selectedMethod)?.name}
                                </Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                <Ionicons name="share-outline" size={24} color={COLORS.primary} />
                                <Text style={styles.actionButtonText}>শেয়ার</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
                                <Ionicons name="refresh" size={24} color={COLORS.primary} />
                                <Text style={styles.actionButtonText}>নতুন</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    title: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        ...SHADOWS.sm,
    },
    currencySymbol: {
        fontSize: FONT_SIZES['3xl'],
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginRight: SPACING.sm,
    },
    amountInput: {
        flex: 1,
        fontSize: FONT_SIZES['3xl'],
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    methodsGrid: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    methodCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray200,
        ...SHADOWS.sm,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    methodName: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    checkMark: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
        ...SHADOWS.base,
    },
    generateButtonDisabled: {
        backgroundColor: COLORS.gray400,
    },
    generateButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    qrContainer: {
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        ...SHADOWS.lg,
    },
    qrPlaceholder: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    qrNote: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: SPACING.sm,
    },
    qrAmount: {
        fontSize: FONT_SIZES['3xl'],
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    methodBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    methodBadgeText: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.xl,
        marginTop: SPACING.xl,
    },
    actionButton: {
        alignItems: 'center',
        padding: SPACING.md,
    },
    actionButtonText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
});
