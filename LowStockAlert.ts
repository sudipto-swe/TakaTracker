/**
 * Cinematic Low Stock Alert — Full-screen dramatic overlay notification.
 * Inspired by bKash/Google Pay notification style + cinematic urgency.
 * Dark glassmorphism, dramatic red/orange glow, two action buttons.
 * Auto-dismisses after 8 seconds or user interaction.
 */
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LowStockWarning } from '../store/inventoryStore';
import { FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LowStockAlertProps {
    warning: LowStockWarning | null;
    onDismiss: () => void;
    onReorder?: () => void;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ warning, onDismiss, onReorder }) => {
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.7)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const badgeBounce = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(0.3)).current;
    const buttonSlide = useRef(new Animated.Value(60)).current;
    const progressWidth = useRef(new Animated.Value(SCREEN_WIDTH * 0.85)).current;

    useEffect(() => {
        if (warning) {
            // Reset animations
            overlayAnim.setValue(0);
            cardScale.setValue(0.7);
            cardOpacity.setValue(0);
            badgeBounce.setValue(0);
            buttonSlide.setValue(60);
            progressWidth.setValue(SCREEN_WIDTH * 0.85);

            // 1. Fade in dark overlay
            Animated.timing(overlayAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // 2. Card zoom + fade in
            Animated.parallel([
                Animated.spring(cardScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();

            // 3. Badge bounce
            Animated.sequence([
                Animated.delay(300),
                Animated.spring(badgeBounce, {
                    toValue: 1,
                    friction: 4,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            // 4. Buttons slide up
            Animated.sequence([
                Animated.delay(500),
                Animated.spring(buttonSlide, {
                    toValue: 0,
                    friction: 8,
                    tension: 60,
                    useNativeDriver: true,
                }),
            ]).start();

            // 5. Red glow pulse loop
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowPulse, {
                        toValue: 0.8,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowPulse, {
                        toValue: 0.3,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // 6. Progress bar countdown (8 seconds)
            Animated.timing(progressWidth, {
                toValue: 0,
                duration: 8000,
                useNativeDriver: false,
            }).start();

            // Auto-dismiss after 8 seconds
            const timer = setTimeout(handleDismiss, 8000);
            return () => clearTimeout(timer);
        }
    }, [warning]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(overlayAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(cardScale, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss());
    };

    const handleReorder = () => {
        handleDismiss();
        onReorder?.();
    };

    if (!warning) return null;

    const isOutOfStock = warning.currentStock === 0;

    return (
        <Modal visible={!!warning} transparent animationType="none" statusBarTranslucent>
            {/* Dark overlay */}
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                {/* Red danger glow pulse */}
                <Animated.View style={[styles.dangerGlow, { opacity: glowPulse }]} />

                {/* Main Card */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            transform: [{ scale: cardScale }],
                            opacity: cardOpacity,
                        },
                    ]}
                >
                    {/* Top red-to-dark gradient */}
                    <View style={styles.cardGradientTop}>
                        <LinearGradient
                            colors={isOutOfStock
                                ? ['#7f1d1d', '#1a0505', '#0a0a0f']
                                : ['#7c2d12', '#1a0f05', '#0a0a0f']
                            }
                            style={styles.gradientFill}
                        />
                    </View>

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
                        <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    {/* ⚠️ Urgent Badge */}
                    <Animated.View
                        style={[
                            styles.urgentBadge,
                            isOutOfStock ? styles.badgeRed : styles.badgeOrange,
                            {
                                transform: [{
                                    scale: badgeBounce.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1],
                                    }),
                                }],
                            },
                        ]}
                    >
                        <Ionicons
                            name={isOutOfStock ? 'close-circle' : 'warning'}
                            size={24}
                            color="#fff"
                        />
                        <Text style={styles.urgentBadgeText}>
                            {isOutOfStock ? 'স্টক শেষ!' : 'স্টক কম!'}
                        </Text>
                    </Animated.View>
                    <Text style={styles.urgentSubBadge}>
                        {isOutOfStock ? 'Out of Stock!' : 'Low Stock Alert!'}
                    </Text>

                    {/* Danger icon circle */}
                    <View style={[styles.dangerCircle, isOutOfStock ? styles.circleRed : styles.circleOrange]}>
                        <Ionicons
                            name={isOutOfStock ? 'alert-circle' : 'cube-outline'}
                            size={48}
                            color={isOutOfStock ? '#fca5a5' : '#fdba74'}
                        />
                    </View>

                    {/* Product Name */}
                    <Text style={styles.productName}>{warning.productName}</Text>

                    {/* Stock Count — dramatic */}
                    <View style={styles.stockCountRow}>
                        <Text style={styles.stockLabel}>
                            {isOutOfStock ? 'স্টক সম্পূর্ণ শেষ!' : 'মাত্র'}
                        </Text>
                        {!isOutOfStock && (
                            <View style={styles.stockNumberBox}>
                                <Text style={styles.stockNumber}>{warning.currentStock}</Text>
                                <Text style={styles.stockUnit}>{warning.unit}</Text>
                            </View>
                        )}
                        {!isOutOfStock && (
                            <Text style={styles.stockLabel}>বাকি আছে!</Text>
                        )}
                    </View>
                    <Text style={styles.stockEnglish}>
                        {isOutOfStock
                            ? 'Completely out of stock!'
                            : `Only ${warning.currentStock} ${warning.unit} left!`
                        }
                    </Text>

                    {/* Emotional CTA headline */}
                    <View style={styles.ctaBox}>
                        <Text style={styles.ctaText}>
                            {isOutOfStock
                                ? 'এখনই অর্ডার করুন!\nবিক্রি হারাচ্ছেন!'
                                : 'আজই অর্ডার করুন!\nনা হলে বিক্রি মিস হবে!'
                            }
                        </Text>
                    </View>

                    {/* Progress bar for auto-dismiss */}
                    <View style={styles.progressTrack}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                isOutOfStock ? styles.progressRed : styles.progressOrange,
                                { width: progressWidth },
                            ]}
                        />
                    </View>

                    {/* Action Buttons */}
                    <Animated.View
                        style={[
                            styles.buttonsContainer,
                            { transform: [{ translateY: buttonSlide }] },
                        ]}
                    >
                        {/* Primary: Reorder / Acknowledge */}
                        <TouchableOpacity
                            style={styles.reorderBtn}
                            onPress={handleReorder}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#059669', '#10b981', '#34d399']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.reorderGradient}
                            >
                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                <Text style={styles.reorderBtnText}>বুঝেছি, ধন্যবাদ</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Secondary: Remind Later */}
                        <TouchableOpacity
                            style={styles.laterBtn}
                            onPress={handleDismiss}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.laterBtnText}>পরে দেখব</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 5, 15, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerGlow: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.15,
        left: -50,
        right: -50,
        height: SCREEN_HEIGHT * 0.4,
        backgroundColor: '#dc2626',
        borderRadius: 300,
        // blur effect simulated via large border radius + opacity
    },
    card: {
        width: SCREEN_WIDTH * 0.88,
        maxWidth: 400,
        backgroundColor: '#0f0f1a',
        borderRadius: 28,
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 100, 100, 0.15)',
        // Shadow
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 25,
    },
    cardGradientTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        overflow: 'hidden',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    gradientFill: {
        flex: 1,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        padding: 4,
    },

    // Urgent Badge
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 8,
        marginBottom: 4,
    },
    badgeOrange: {
        backgroundColor: '#ea580c',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    badgeRed: {
        backgroundColor: '#dc2626',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    urgentBadgeText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    urgentSubBadge: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 20,
    },

    // Danger Circle
    dangerCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    circleOrange: {
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(251, 146, 60, 0.4)',
    },
    circleRed: {
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(252, 165, 165, 0.4)',
    },

    // Product Name
    productName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 12,
    },

    // Stock Count
    stockCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    stockLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    stockNumberBox: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    stockNumber: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fca5a5',
    },
    stockUnit: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fca5a5',
        marginLeft: 4,
    },
    stockEnglish: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
        marginBottom: 16,
    },

    // CTA
    ctaBox: {
        backgroundColor: 'rgba(234, 88, 12, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(251, 146, 60, 0.25)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        width: '100%',
    },
    ctaText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fdba74',
        textAlign: 'center',
        lineHeight: 26,
    },

    // Progress bar
    progressTrack: {
        width: '100%',
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 18,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressOrange: {
        backgroundColor: '#fb923c',
    },
    progressRed: {
        backgroundColor: '#f87171',
    },

    // Buttons
    buttonsContainer: {
        width: '100%',
        gap: 10,
    },
    reorderBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    reorderGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    reorderBtnText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
    },
    laterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    laterBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
    },
});
