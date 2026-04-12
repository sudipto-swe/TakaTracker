/**
 * More Screen - Settings and additional features with RBAC guards.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
    Linking,
    TextInput,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../store/authStore';
import { useLanguage } from '../i18n/LanguageContext';
import { useSyncStore } from '../store/syncStore';
import { useSettingsStore } from '../store/settingsStore';
import { Can, useCan } from '../rbac';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { t } from '../i18n';

const HOTLINE_NUMBER = '01765732961';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sublabel?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    sublabel,
    onPress,
    showArrow = true,
    rightElement,
}) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.menuIcon}>
            <Ionicons name={icon} size={22} color={COLORS.primary} />
        </View>
        <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>{label}</Text>
            {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
        </View>
        {rightElement || (showArrow && (
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
        ))}
    </TouchableOpacity>
);

/** Small role badge displayed next to the user's name */
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const badgeColors: Record<string, string> = {
        merchant: COLORS.primary,
        staff: COLORS.warning,
        admin: COLORS.success,
    };
    const badgeLabels: Record<string, string> = {
        merchant: t('auth.merchant', { defaultValue: 'Merchant' }),
        staff: t('auth.staff', { defaultValue: 'Staff' }),
        admin: t('auth.admin', { defaultValue: 'Admin' }),
    };
    return (
        <View style={[styles.roleBadge, { backgroundColor: (badgeColors[role] || COLORS.gray400) + '20' }]}>
            <Text style={[styles.roleBadgeText, { color: badgeColors[role] || COLORS.gray400 }]}>
                {badgeLabels[role] || role}
            </Text>
        </View>
    );
};

export const MoreScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, logout, updateUser } = useAuthStore();
    const { language, changeLanguage } = useLanguage();
    const { isOnline, isSyncing, lastSyncAt, pendingCount, setSyncing, setLastSync } = useSyncStore();
    const {
        voiceModeEnabled, setVoiceMode,
        conversationTrackingEnabled, setConversationTracking,
        showPredictions, setShowPredictions,
        showComboOffers, setShowComboOffers,
    } = useSettingsStore();

    // Business name editing modal state
    const [showBusinessNameModal, setShowBusinessNameModal] = useState(false);
    const [businessNameInput, setBusinessNameInput] = useState(user?.businessName || '');

    // RBAC permission checks
    const canViewReports = useCan('view', 'reports');
    const canManagePayments = useCan('manage', 'payments');
    const canManageSettings = useCan('manage', 'settings');

    const handleLanguageToggle = () => {
        changeLanguage(language === 'bn' ? 'en' : 'bn');
    };

    const handleLogout = () => {
        logout();
    };

    // ── Business Name ──
    const handleEditBusinessName = () => {
        setBusinessNameInput(user?.businessName || '');
        setShowBusinessNameModal(true);
    };

    const handleSaveBusinessName = () => {
        const trimmed = businessNameInput.trim();
        if (trimmed) {
            updateUser({ businessName: trimmed });
            setShowBusinessNameModal(false);
            Alert.alert(t('common.success'), t('settings.businessNameUpdated'));
        }
    };

    // ── Sync Now ──
    const handleSyncNow = () => {
        if (isSyncing) return;
        setSyncing(true);
        // Simulate sync process (replace with real sync when backend is wired)
        setTimeout(() => {
            setLastSync(new Date().toISOString());
            setSyncing(false);
            Alert.alert(t('settings.syncComplete'), t('settings.syncSuccess'));
        }, 2000);
    };

    // ── Notifications ──
    const handleNotifications = () => {
        navigation.navigate('Notifications');
    };

    // ── Security (Coming Soon) ──
    const handleSecurity = () => {
        Alert.alert(t('settings.comingSoon'), t('settings.comingSoonMsg'));
    };

    // ── Help — Call Hotline ──
    const handleHelp = () => {
        Alert.alert(
            t('settings.callHotline'),
            t('settings.hotlineMsg'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('settings.call'), onPress: () => Linking.openURL(`tel:${HOTLINE_NUMBER}`) },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{t('settings.title')}</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.profileCard} onPress={handleEditBusinessName}>
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileAvatarText}>
                                {(user?.name || user?.businessName || 'U').charAt(0)}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <View style={styles.profileNameRow}>
                                <Text style={styles.profileName}>
                                    {user?.businessName || user?.name || t('auth.businessName')}
                                </Text>
                                {user?.role && <RoleBadge role={user.role} />}
                            </View>
                            <Text style={styles.profilePhone}>+88{user?.phone || '01XXXXXXXXX'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                {/* Business Features — Permission Guarded */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('more.title')}</Text>
                    <View style={styles.menuGroup}>
                        {/* Inventory: visible to anyone with view:inventory */}
                        <Can action="view" subject="inventory">
                            <MenuItem
                                icon="cube-outline"
                                label={t('inventory.title')}
                                sublabel={t('more.inventorySub')}
                                onPress={() => navigation.navigate('Inventory')}
                            />
                        </Can>

                        {/* Reports: only for users with view:reports */}
                        <Can action="view" subject="reports">
                            <MenuItem
                                icon="stats-chart-outline"
                                label={t('reports.title')}
                                sublabel={t('more.reportsSub')}
                                onPress={() => navigation.navigate('Reports')}
                            />
                        </Can>

                        {/* QR Payments: only for users with manage:payments */}
                        <Can action="manage" subject="payments">
                            <MenuItem
                                icon="qr-code-outline"
                                label={t('payments.qrPayment')}
                                sublabel={t('more.qrSub')}
                                onPress={() => navigation.navigate('QRPayment')}
                            />
                        </Can>

                        {/* Notifications: visible to all */}
                        <Can action="view" subject="notifications">
                            <MenuItem
                                icon="notifications-outline"
                                label={t('more.notificationsTitle', { defaultValue: 'Dues Notifications' })}
                                sublabel={t('more.notificationsSub', { defaultValue: 'View detailed list of customers with dues' })}
                                onPress={() => navigation.navigate('Notifications')}
                            />
                        </Can>
                    </View>
                </View>

                {/* Smart Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('smart.smartFeatures')}</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem
                            icon="chatbubble-ellipses-outline"
                            label={t('chatbot.menuTitle')}
                            sublabel={t('chatbot.menuSub')}
                            onPress={() => navigation.navigate('ChatBot' as never)}
                        />
                        <MenuItem
                            icon="mic-outline"
                            label={t('smart.voiceMode')}
                            sublabel={t('smart.voiceModeSub')}
                            showArrow={false}
                            rightElement={
                                <Switch
                                    value={voiceModeEnabled}
                                    onValueChange={setVoiceMode}
                                    trackColor={{ true: COLORS.accent, false: COLORS.gray300 }}
                                />
                            }
                        />
                        <MenuItem
                            icon="chatbubbles-outline"
                            label={t('smart.conversationTracking')}
                            sublabel={t('smart.conversationTrackingSub')}
                            showArrow={false}
                            rightElement={
                                <Switch
                                    value={conversationTrackingEnabled}
                                    onValueChange={setConversationTracking}
                                    trackColor={{ true: COLORS.accent, false: COLORS.gray300 }}
                                />
                            }
                        />
                        <MenuItem
                            icon="bulb-outline"
                            label={t('smart.smartSuggestions')}
                            sublabel={t('smart.smartSuggestionsSub')}
                            showArrow={false}
                            rightElement={
                                <Switch
                                    value={showPredictions}
                                    onValueChange={setShowPredictions}
                                    trackColor={{ true: '#8B5CF6', false: COLORS.gray300 }}
                                />
                            }
                        />
                        <MenuItem
                            icon="pricetags-outline"
                            label={t('smart.comboOffers')}
                            sublabel={t('smart.comboOffersSub')}
                            showArrow={false}
                            rightElement={
                                <Switch
                                    value={showComboOffers}
                                    onValueChange={setShowComboOffers}
                                    trackColor={{ true: COLORS.success, false: COLORS.gray300 }}
                                />
                            }
                        />
                        <MenuItem
                            icon="analytics-outline"
                            label={t('smart.viewDetailedPredictions')}
                            sublabel={t('smart.viewDetailedPredictionsSub')}
                            onPress={() => navigation.navigate('Predictions' as never)}
                        />
                    </View>
                </View>

                {/* Sync Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.sync')}</Text>
                    <View style={styles.syncCard}>
                        <View style={styles.syncStatus}>
                            <View style={[
                                styles.syncDot,
                                { backgroundColor: isOnline ? COLORS.success : COLORS.warning }
                            ]} />
                            <Text style={styles.syncStatusText}>
                                {isOnline ? t('settings.online') : t('settings.offline')}
                            </Text>
                        </View>
                        {lastSyncAt && (
                            <Text style={styles.syncTime}>
                                {t('settings.lastSync')}: {new Date(lastSyncAt).toLocaleTimeString('bn-BD')}
                            </Text>
                        )}
                        {pendingCount > 0 && (
                            <Text style={styles.pendingCount}>
                                {pendingCount} {t('settings.syncPending')}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[styles.syncButton, isSyncing && { opacity: 0.7 }]}
                            onPress={handleSyncNow}
                            disabled={isSyncing}
                        >
                            {isSyncing ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Ionicons name="sync" size={18} color={COLORS.white} />
                            )}
                            <Text style={styles.syncButtonText}>
                                {isSyncing ? t('settings.syncing') : t('settings.syncNow')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings — some items permission-guarded */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem
                            icon="language-outline"
                            label={t('settings.language')}
                            sublabel={language === 'bn' ? 'বাংলা' : 'English'}
                            showArrow={false}
                            rightElement={
                                <Switch
                                    value={language === 'en'}
                                    onValueChange={handleLanguageToggle}
                                    trackColor={{ true: COLORS.primary, false: COLORS.gray300 }}
                                />
                            }
                        />
                        <MenuItem
                            icon="notifications-outline"
                            label={t('settings.notifications')}
                            onPress={handleNotifications}
                        />
                        <Can action="manage" subject="settings">
                            <MenuItem
                                icon="shield-checkmark-outline"
                                label={t('settings.security')}
                                onPress={handleSecurity}
                            />
                        </Can>
                    </View>
                </View>

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.help')}</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem
                            icon="call-outline"
                            label={t('settings.callHotline')}
                            sublabel={HOTLINE_NUMBER}
                            onPress={handleHelp}
                        />
                        <MenuItem
                            icon="information-circle-outline"
                            label={t('settings.about')}
                            sublabel={`${t('settings.version')} 1.0.0`}
                        />
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Business Name Edit Modal */}
            <Modal
                visible={showBusinessNameModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBusinessNameModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('settings.editBusinessName')}</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={businessNameInput}
                            onChangeText={setBusinessNameInput}
                            placeholder={t('settings.enterBusinessName')}
                            placeholderTextColor={COLORS.gray400}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowBusinessNameModal(false)}
                            >
                                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveButton}
                                onPress={handleSaveBusinessName}
                            >
                                <Text style={styles.modalSaveText}>{t('common.save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingTop: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.sm,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    profileAvatarText: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    profileInfo: {
        flex: 1,
    },
    profileNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileName: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    roleBadgeText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '600',
    },
    profilePhone: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    menuGroup: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuContent: {
        flex: 1,
    },
    menuLabel: {
        fontSize: FONT_SIZES.base,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    menuSublabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    syncCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.sm,
    },
    syncStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    syncDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.sm,
    },
    syncStatusText: {
        fontSize: FONT_SIZES.base,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    syncTime: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    pendingCount: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.warning,
        marginBottom: SPACING.md,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.xs,
    },
    syncButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.error,
        gap: SPACING.sm,
    },
    logoutText: {
        fontSize: FONT_SIZES.base,
        fontWeight: '600',
        color: COLORS.error,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        ...SHADOWS.md,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
    },
    modalCancelButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray300,
    },
    modalCancelText: {
        fontSize: FONT_SIZES.base,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    modalSaveButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary,
    },
    modalSaveText: {
        fontSize: FONT_SIZES.base,
        color: COLORS.white,
        fontWeight: '600',
    },
});
