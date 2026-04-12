/**
 * BarcodeScannerModal - Full-screen camera modal for barcode scanning.
 * Supports barcode scan mode + photo capture mode.
 * Falls back to manual barcode entry when expo-camera is unavailable.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Easing,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { t } from '../../i18n';

interface BarcodeScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onBarcodeScanned: (barcode: string, type: string) => void;
    onPhotoTaken?: (uri: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
    visible,
    onClose,
    onBarcodeScanned,
    onPhotoTaken,
}) => {
    const [mode, setMode] = useState<'barcode' | 'photo'>('barcode');
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const cameraRef = useRef<any>(null);

    // Animated scan line
    useEffect(() => {
        if (visible && mode === 'barcode') {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        }
    }, [visible, mode]);

    // Request camera permission when modal opens
    useEffect(() => {
        if (visible && permission && !permission.granted) {
            requestPermission();
        }
    }, [visible]);

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        onBarcodeScanned(data, type);
    };

    const handleTakePhoto = async () => {
        if (cameraRef.current && onPhotoTaken) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
                onPhotoTaken(photo.uri);
            } catch (e) {
                Alert.alert(t('scanner.error'), t('scanner.photoError'));
            }
        }
    };

    const handleClose = () => {
        setScanned(false);
        setMode('barcode');
        onClose();
    };

    const scanLineTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 220],
    });

    const hasPermission = permission?.granted;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                        <Ionicons name="close" size={28} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {mode === 'barcode' ? t('scanner.barcodeScan') : t('scanner.takePhoto')}
                    </Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Mode Toggle */}
                <View style={styles.modeToggle}>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'barcode' && styles.modeBtnActive]}
                        onPress={() => { setMode('barcode'); setScanned(false); }}
                    >
                        <Ionicons name="barcode-outline" size={18} color={mode === 'barcode' ? COLORS.white : COLORS.gray400} />
                        <Text style={[styles.modeBtnText, mode === 'barcode' && styles.modeBtnTextActive]}>
                            {t('scanner.barcode')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'photo' && styles.modeBtnActive]}
                        onPress={() => setMode('photo')}
                    >
                        <Ionicons name="camera-outline" size={18} color={mode === 'photo' ? COLORS.white : COLORS.gray400} />
                        <Text style={[styles.modeBtnText, mode === 'photo' && styles.modeBtnTextActive]}>
                            {t('scanner.photo')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Camera / Permission / Fallback */}
                {!hasPermission ? (
                    <View style={styles.fallbackContainer}>
                        <View style={styles.fallbackContent}>
                            <View style={styles.fallbackIconContainer}>
                                <Ionicons name="barcode-outline" size={64} color={COLORS.primary} />
                            </View>
                            <Text style={styles.fallbackTitle}>{t('scanner.barcodeScanner')}</Text>
                            <Text style={styles.fallbackText}>
                                {permission?.canAskAgain ? t('scanner.cameraPermission') : t('scanner.cameraUnavailable')}
                            </Text>

                            {permission?.canAskAgain && (
                                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                                    <Ionicons name="camera-outline" size={20} color={COLORS.white} />
                                    <Text style={styles.permissionBtnText}>{t('scanner.cameraPermission')}</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.manualInputContainer}>
                                <ManualBarcodeInput onSubmit={(code) => onBarcodeScanned(code, 'manual')} />
                            </View>

                            <TouchableOpacity style={styles.fallbackCloseBtn} onPress={handleClose}>
                                <Text style={styles.fallbackCloseBtnText}>{t('scanner.close')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.cameraContainer}>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            barcodeScannerSettings={{
                                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr', 'code128', 'code39'],
                            }}
                            onBarcodeScanned={mode === 'barcode' && !scanned ? handleBarCodeScanned : undefined}
                        />

                        {/* Scan Frame Overlay */}
                        {mode === 'barcode' && (
                            <View style={styles.scanOverlay}>
                                <View style={styles.scanFrame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                    <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]} />
                                </View>
                                <Text style={styles.scanHint}>
                                    {scanned ? t('scanner.scannedSuccess') : t('scanner.scanHint')}
                                </Text>
                            </View>
                        )}

                        {/* Photo capture button */}
                        {mode === 'photo' && (
                            <View style={styles.photoControls}>
                                <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto}>
                                    <View style={styles.captureBtnInner} />
                                </TouchableOpacity>
                                <Text style={styles.scanHint}>{t('scanner.photoHint')}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Scanned result action */}
                {scanned && (
                    <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                        <Ionicons name="refresh" size={20} color={COLORS.white} />
                        <Text style={styles.rescanBtnText}>{t('scanner.rescan')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Modal>
    );
};

const ManualBarcodeInput: React.FC<{ onSubmit: (code: string) => void }> = ({ onSubmit }) => {
    const [code, setCode] = React.useState('');
    return (
        <View style={styles.manualInput}>
            <View style={styles.manualInputRow}>
                <Ionicons name="barcode-outline" size={20} color={COLORS.primary} />
                <View style={styles.manualTextInputWrapper}>
                    <Text style={styles.manualInputLabel}>{t('scanner.barcodeNumber')}</Text>
                    <View style={styles.manualInputField}>
                        <TextInput
                            style={styles.manualTextInput}
                            placeholder={t('scanner.enterBarcode')}
                            placeholderTextColor={COLORS.gray400}
                            value={code}
                            onChangeText={setCode}
                            keyboardType="default"
                        />
                    </View>
                </View>
            </View>
            <TouchableOpacity
                style={[styles.manualSubmitBtn, !code.trim() && { opacity: 0.5 }]}
                onPress={() => code.trim() && onSubmit(code.trim())}
                disabled={!code.trim()}
            >
                <Ionicons name="search" size={18} color={COLORS.white} />
                <Text style={styles.manualSubmitText}>{t('scanner.find')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: SPACING.md, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10,
    },
    headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.white },
    modeToggle: {
        flexDirection: 'row', justifyContent: 'center', padding: SPACING.sm,
        backgroundColor: 'rgba(0,0,0,0.7)', gap: SPACING.sm, zIndex: 10,
    },
    modeBtn: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.1)', gap: SPACING.xs,
    },
    modeBtnActive: { backgroundColor: COLORS.primary },
    modeBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.gray400 },
    modeBtnTextActive: { color: COLORS.white, fontWeight: '600' },
    cameraContainer: { flex: 1, position: 'relative' },
    camera: { flex: 1 },
    scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: 260, height: 260, position: 'relative' },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.primary },
    topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
    topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
    scanLine: { width: '100%', height: 2, backgroundColor: COLORS.primary, opacity: 0.8 },
    scanHint: {
        fontSize: FONT_SIZES.sm, color: COLORS.white, marginTop: SPACING.lg, textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    },
    photoControls: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
    captureBtn: {
        width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: COLORS.white,
        justifyContent: 'center', alignItems: 'center',
    },
    captureBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.white },
    rescanBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.full,
        position: 'absolute', bottom: 40, alignSelf: 'center', gap: SPACING.sm,
    },
    rescanBtnText: { fontSize: FONT_SIZES.base, color: COLORS.white, fontWeight: '600' },
    fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    fallbackContent: { alignItems: 'center', width: '100%' },
    fallbackIconContainer: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary + '15',
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
    },
    fallbackTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.white, marginBottom: SPACING.sm },
    fallbackText: {
        fontSize: FONT_SIZES.base, color: COLORS.gray400, textAlign: 'center',
        marginBottom: SPACING.xl, lineHeight: 22,
    },
    permissionBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.md, gap: SPACING.sm, marginBottom: SPACING.xl,
    },
    permissionBtnText: { fontSize: FONT_SIZES.base, color: COLORS.white, fontWeight: '600' },
    fallbackCloseBtn: {
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray400, marginTop: SPACING.lg,
    },
    fallbackCloseBtnText: { fontSize: FONT_SIZES.base, color: COLORS.white, fontWeight: '500' },
    manualInputContainer: { width: '100%', maxWidth: 340 },
    manualInput: { width: '100%' },
    manualInputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.md },
    manualTextInputWrapper: { flex: 1 },
    manualInputLabel: { fontSize: FONT_SIZES.xs, color: COLORS.gray400, marginBottom: SPACING.xs },
    manualInputField: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BORDER_RADIUS.md,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    manualTextInput: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZES.base, color: COLORS.white },
    manualSubmitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm,
    },
    manualSubmitText: { fontSize: FONT_SIZES.base, color: COLORS.white, fontWeight: '600' },
});
