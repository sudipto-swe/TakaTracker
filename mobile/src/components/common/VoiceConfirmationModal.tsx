/**
 * VoiceConfirmationModal - Shows extracted data for shopowner review.
 * All strings use t() for i18n support.
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { t } from '../../i18n';
import { ExtractedTransactionData } from '../../services/voiceService';
import { SmartDropdown, DropdownOption } from './SmartDropdown';

interface VoiceConfirmationModalProps {
    visible: boolean;
    data: ExtractedTransactionData | null;
    productOptions: DropdownOption[];
    contactOptions: DropdownOption[];
    onConfirm: (data: ExtractedTransactionData) => void;
    onCancel: () => void;
}

const getUnitOptions = (): DropdownOption[] => [
    { label: t('units.pcs'), value: 'পিস', icon: 'cube-outline' },
    { label: t('units.kg'), value: 'কেজি', icon: 'cube-outline' },
    { label: t('units.ltr'), value: 'লিটার', icon: 'water-outline' },
    { label: t('units.dozen'), value: 'ডজন', icon: 'grid-outline' },
    { label: t('units.pack'), value: 'প্যাকেট', icon: 'cube-outline' },
];

const getPayOptions = (): DropdownOption[] => [
    { label: t('dropdown.cashPayment'), value: 'cash', icon: 'cash-outline', iconColor: COLORS.success },
    { label: t('dropdown.bkashPayment'), value: 'bkash', icon: 'phone-portrait-outline', iconColor: '#E2136E' },
    { label: t('dropdown.nagadPayment'), value: 'nagad', icon: 'phone-portrait-outline', iconColor: '#F6A623' },
    { label: t('dropdown.rocketPayment'), value: 'rocket', icon: 'phone-portrait-outline', iconColor: '#8C3494' },
    { label: t('dropdown.bankPayment'), value: 'bank', icon: 'business-outline', iconColor: COLORS.primary },
];

export const VoiceConfirmationModal: React.FC<VoiceConfirmationModalProps> = ({
    visible, data, productOptions, contactOptions, onConfirm, onCancel,
}) => {
    const [editData, setEditData] = useState<ExtractedTransactionData | null>(null);
    const [qtyStr, setQtyStr] = useState('');
    const [priceStr, setPriceStr] = useState('');

    useEffect(() => {
        if (data) {
            setEditData({ ...data });
            setQtyStr(data.quantity?.toString() || '');
            setPriceStr(data.totalAmount?.toString() || data.price?.toString() || '');
        }
    }, [data]);

    if (!visible || !editData) return null;

    const confidence = editData.confidence;
    const confidenceColor = confidence >= 70 ? COLORS.success : confidence >= 40 ? COLORS.warning : COLORS.error;

    const handleConfirm = () => {
        onConfirm({
            ...editData,
            quantity: parseInt(qtyStr) || editData.quantity,
            totalAmount: parseFloat(priceStr) || editData.totalAmount,
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{t('voice.voiceDataReview')}</Text>
                            <TouchableOpacity onPress={onCancel}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.confidenceContainer}>
                            <View style={styles.confidenceRow}>
                                <Text style={styles.confidenceLabel}>{t('voice.accuracy')}</Text>
                                <Text style={[styles.confidenceValue, { color: confidenceColor }]}>{confidence}%</Text>
                            </View>
                            <View style={styles.confidenceBar}>
                                <View style={[styles.confidenceFill, { width: `${confidence}%`, backgroundColor: confidenceColor }]} />
                            </View>
                            <Text style={styles.confidenceHint}>
                                {confidence >= 70 ? t('voice.accurate') : confidence >= 40 ? t('voice.partialAccurate') : t('voice.review')}
                            </Text>
                        </View>

                        <SmartDropdown
                            label={t('voice.transactionType')}
                            placeholder={t('dropdown.select')}
                            options={[
                                { label: t('voice.saleType'), value: 'sale' },
                                { label: t('voice.purchaseType'), value: 'purchase' },
                                { label: t('voice.expenseType'), value: 'expense' },
                            ]}
                            selectedValue={editData.type || undefined}
                            onSelect={(o) => setEditData(d => d ? { ...d, type: o.value as any } : d)}
                        />

                        <SmartDropdown
                            label={t('voice.product')}
                            placeholder={t('voice.selectProduct')}
                            options={productOptions}
                            selectedValue={editData.productName || undefined}
                            onSelect={(o) => setEditData(d => d ? { ...d, productName: o.value } : d)}
                            allowCustom customLabel={t('voice.addNewProduct')}
                            onCustom={(text) => setEditData(d => d ? { ...d, productName: text } : d)}
                            icon="cube-outline"
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>{t('voice.quantity')}</Text>
                                <TextInput style={styles.fieldInput} value={qtyStr} onChangeText={setQtyStr} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.gray400} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <SmartDropdown label={t('voice.unitLabel')} placeholder={t('voice.unitLabel')} options={getUnitOptions()}
                                    selectedValue={editData.unit || undefined}
                                    onSelect={(o) => setEditData(d => d ? { ...d, unit: o.value } : d)} allowCustom
                                />
                            </View>
                        </View>

                        <Text style={styles.fieldLabel}>{t('voice.totalAmount')}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.currency}>৳</Text>
                            <TextInput style={styles.priceInput} value={priceStr} onChangeText={setPriceStr} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.gray400} />
                        </View>

                        <SmartDropdown label={t('voice.paymentMethod')} placeholder={t('voice.selectPaymentMethod')}
                            options={getPayOptions()} selectedValue={editData.paymentMethod || undefined}
                            onSelect={(o) => setEditData(d => d ? { ...d, paymentMethod: o.value as any } : d)}
                        />

                        <SmartDropdown label={t('voice.contactLabel')} placeholder={t('voice.selectContact')}
                            options={contactOptions} selectedValue={editData.customerName || undefined}
                            onSelect={(o) => setEditData(d => d ? { ...d, customerName: o.label, customerPhone: o.subtitle || null } : d)}
                            allowCustom customLabel={t('voice.addNewContact')}
                            onCustom={(text) => setEditData(d => d ? { ...d, customerName: text } : d)}
                            icon="person-outline"
                        />

                        <TouchableOpacity style={[styles.dueToggle, editData.isDue && styles.dueToggleActive]}
                            onPress={() => setEditData(d => d ? { ...d, isDue: !d.isDue } : d)}>
                            <Ionicons name={editData.isDue ? 'checkbox' : 'square-outline'} size={22} color={editData.isDue ? COLORS.warning : COLORS.gray400} />
                            <Text style={[styles.dueToggleText, editData.isDue && { color: COLORS.warning }]}>{t('voice.dueSale')}</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.editBtn} onPress={onCancel}>
                            <Ionicons name="close-outline" size={20} color={COLORS.error} />
                            <Text style={styles.editBtnText}>{t('voice.cancelBtn')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                            <Text style={styles.confirmBtnText}>{t('voice.allCorrect')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    content: {
        backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING['3xl'], maxHeight: '90%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    confidenceContainer: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
    confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
    confidenceLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    confidenceValue: { fontSize: FONT_SIZES.md, fontWeight: 'bold' },
    confidenceBar: { height: 6, backgroundColor: COLORS.gray200, borderRadius: 3, marginBottom: SPACING.xs },
    confidenceFill: { height: 6, borderRadius: 3 },
    confidenceHint: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    row: { flexDirection: 'row', gap: SPACING.sm },
    fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
    fieldInput: {
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.gray200,
        fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary,
    },
    priceRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200, paddingHorizontal: SPACING.md,
    },
    currency: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.primary },
    priceInput: { flex: 1, fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary, paddingVertical: SPACING.md, marginLeft: SPACING.sm },
    dueToggle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, marginTop: SPACING.md },
    dueToggleActive: {},
    dueToggleText: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
    actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
    editBtn: {
        flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.error, gap: SPACING.xs,
    },
    editBtnText: { fontSize: FONT_SIZES.base, color: COLORS.error, fontWeight: '600' },
    confirmBtn: {
        flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.success, gap: SPACING.xs,
    },
    confirmBtnText: { fontSize: FONT_SIZES.base, color: COLORS.white, fontWeight: '600' },
});
