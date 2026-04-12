/**
 * VoiceInputButton - Floating mic button with animated pulse.
 * All strings use t() for i18n support.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Animated, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';
import { VoiceState } from '../../services/voiceService';

interface VoiceInputButtonProps {
    onTextCaptured: (text: string) => void;
    isEnabled: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTextCaptured, isEnabled }) => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [showInputModal, setShowInputModal] = useState(false);
    const [inputText, setInputText] = useState('');
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (voiceState === 'listening') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            );
            const glow = Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
                ])
            );
            pulse.start(); glow.start();
            return () => { pulse.stop(); glow.stop(); };
        } else { pulseAnim.setValue(1); glowAnim.setValue(0); }
    }, [voiceState]);

    if (!isEnabled) return null;

    const handlePress = () => { setShowInputModal(true); setVoiceState('listening'); setInputText(''); };

    const handleSubmit = () => {
        if (inputText.trim()) {
            setVoiceState('processing');
            setTimeout(() => {
                onTextCaptured(inputText.trim());
                setVoiceState('done'); setShowInputModal(false); setInputText('');
                setTimeout(() => setVoiceState('idle'), 1000);
            }, 500);
        }
    };

    const handleCancel = () => { setShowInputModal(false); setVoiceState('idle'); setInputText(''); };

    const quickPhrases = [
        { key: 'sale', label: t('voice.sale') },
        { key: 'purchase', label: t('voice.purchase') },
        { key: 'due', label: t('voice.due') },
        { key: 'cash', label: t('voice.cash') },
        { key: 'bkash', label: t('voice.bkash') },
    ];

    return (
        <>
            <View style={styles.floatingContainer}>
                {voiceState === 'listening' && (
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: glowAnim }]} />
                )}
                <TouchableOpacity
                    style={[styles.floatingBtn, voiceState === 'listening' && styles.floatingBtnActive]}
                    onPress={handlePress} activeOpacity={0.8}
                >
                    <Ionicons name={voiceState === 'listening' ? 'mic' : 'mic-outline'} size={26} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.floatingLabel}>{t('voice.voiceLabel')}</Text>
            </View>

            <Modal visible={showInputModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <View style={[styles.micIndicator, voiceState === 'listening' && styles.micIndicatorActive]}>
                                    <Ionicons name="mic" size={20} color={COLORS.white} />
                                </View>
                                <Text style={styles.modalTitle}>
                                    {voiceState === 'listening' ? t('voice.listening') : voiceState === 'processing' ? t('voice.processing') : t('voice.voiceInput')}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleCancel}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.hint}>{t('voice.hint')}</Text>

                        <TextInput
                            style={styles.voiceInput} value={inputText} onChangeText={setInputText}
                            placeholder={t('voice.placeholder')} placeholderTextColor={COLORS.gray400}
                            multiline numberOfLines={4} textAlignVertical="top" autoFocus
                        />

                        <Text style={styles.quickLabel}>{t('voice.quickPhrases')}</Text>
                        <View style={styles.quickPhrases}>
                            {quickPhrases.map(p => (
                                <TouchableOpacity key={p.key} style={styles.quickChip}
                                    onPress={() => setInputText(prev => prev + ' ' + p.label)}>
                                    <Text style={styles.quickChipText}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                                <Text style={styles.cancelBtnText}>{t('voice.cancelBtn')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, !inputText.trim() && { opacity: 0.5 }]}
                                onPress={handleSubmit} disabled={!inputText.trim()}
                            >
                                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                                <Text style={styles.submitBtnText}>{t('voice.process')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    floatingContainer: { alignItems: 'center' },
    pulseRing: {
        position: 'absolute', width: 64, height: 64, borderRadius: 32,
        backgroundColor: COLORS.accent + '30', top: -4,
    },
    floatingBtn: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent,
        justifyContent: 'center', alignItems: 'center', ...SHADOWS.md,
    },
    floatingBtnActive: { backgroundColor: COLORS.error },
    floatingLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING['3xl'],
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    micIndicator: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray400, justifyContent: 'center', alignItems: 'center' },
    micIndicatorActive: { backgroundColor: COLORS.error },
    modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    hint: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: SPACING.md, lineHeight: 20 },
    voiceInput: {
        backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
        fontSize: FONT_SIZES.base, color: COLORS.textPrimary, minHeight: 100,
        borderWidth: 1, borderColor: COLORS.primary + '30', marginBottom: SPACING.md,
    },
    quickLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginBottom: SPACING.xs },
    quickPhrases: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.lg },
    quickChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary + '10' },
    quickChipText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '500' },
    modalActions: { flexDirection: 'row', gap: SPACING.sm },
    cancelBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray300, alignItems: 'center' },
    cancelBtnText: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
    submitBtn: {
        flex: 2, flexDirection: 'row', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', gap: SPACING.xs,
    },
    submitBtnText: { fontSize: FONT_SIZES.base, color: COLORS.white, fontWeight: '600' },
});
