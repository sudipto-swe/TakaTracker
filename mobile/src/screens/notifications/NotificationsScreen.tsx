/**
 * Notifications Screen — Shows the shop owner all overdue payment alerts.
 * Each notification expands to show full transaction breakdown.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useNotificationStore, ReminderFrequency } from '../../store/notificationStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useContactStore } from '../../store/contactStore';
import {
    getOverdueContacts,
    filterByFrequency,
    refreshNotifications,
    OverdueContact,
} from '../../services/notificationService';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../i18n';

const FREQ_OPTIONS: { key: ReminderFrequency; label: string }[] = [
    { key: 'daily', label: 'সব' },
    { key: 'weekly', label: '৭+ দিন' },
    { key: 'monthly', label: '৩০+ দিন' },
];

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { notifications, isEnabled, frequency, minDueAmount, unreadCount,
        toggleEnabled, setFrequency, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
    const { transactions } = useTransactionStore();
    const { contacts } = useContactStore();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Refresh notifications on mount and when data changes
    useEffect(() => {
        refreshNotifications();
    }, [transactions, contacts, frequency, minDueAmount, isEnabled]);

    // Get full overdue data for expanded view
    const overdueMap = useMemo(() => {
        const map = new Map<string, OverdueContact>();
        const all = getOverdueContacts(minDueAmount);
        all.forEach(o => map.set(o.contact.id, o));
        return map;
    }, [transactions, contacts, minDueAmount]);

    const handleToggleExpand = (notif: typeof notifications[0]) => {
        if (expandedId === notif.id) {
            setExpandedId(null);
        } else {
            setExpandedId(notif.id);
            if (!notif.isRead) markAsRead(notif.id);
        }
    };

    const getDueSeverity = (days: number) => {
        if (days >= 30) return { color: COLORS.error, label: 'জরুরি', icon: 'alert-circle' as const };
        if (days >= 7) return { color: COLORS.warning, label: 'সতর্কতা', icon: 'warning' as const };
        return { color: '#3B82F6', label: 'নতুন', icon: 'information-circle' as const };
    };

    const renderNotification = ({ item }: { item: typeof notifications[0] }) => {
        const isExpanded = expandedId === item.id;
        const severity = getDueSeverity(item.daysSinceOldest);
        const overdue = overdueMap.get(item.contactId);

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    !item.isRead && styles.cardUnread,
                    !item.isRead && { borderLeftColor: severity.color },
                ]}
                onPress={() => handleToggleExpand(item)}
                activeOpacity={0.7}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={[styles.severityIcon, { backgroundColor: severity.color + '15' }]}>
                        <Ionicons name={severity.icon} size={22} color={severity.color} />
                    </View>
                    <View style={styles.cardInfo}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.contactName, !item.isRead && styles.textBold]}>
                                {item.contactName}
                            </Text>
                            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: severity.color }]} />}
                        </View>
                        <Text style={styles.meta}>
                            {item.transactionCount}টি লেনদেন · {item.daysSinceOldest} দিন আগে থেকে
                        </Text>
                    </View>
                    <View style={styles.dueSection}>
                        <Text style={[styles.dueAmount, { color: severity.color }]}>
                            {formatCurrency(item.totalDue)}
                        </Text>
                        <View style={[styles.severityBadge, { backgroundColor: severity.color + '15' }]}>
                            <Text style={[styles.severityText, { color: severity.color }]}>
                                {severity.label}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Expanded: Full transaction breakdown */}
                {isExpanded && overdue && (
                    <View style={styles.expandedBody}>
                        <View style={styles.divider} />

                        {/* Contact info */}
                        {item.contactPhone && (
                            <View style={styles.contactRow}>
                                <Ionicons name="call-outline" size={14} color={COLORS.textMuted} />
                                <Text style={styles.contactPhone}>{item.contactPhone}</Text>
                            </View>
                        )}

                        {/* Transaction breakdown header */}
                        <View style={styles.breakdownHeader}>
                            <Text style={styles.breakdownTitle}>📋 বিস্তারিত হিসাব</Text>
                            <Text style={styles.breakdownCount}>{overdue.unpaidTransactions.length}টি</Text>
                        </View>

                        {/* Each transaction */}
                        {overdue.unpaidTransactions.map((tx, idx) => (
                            <View key={tx.id} style={styles.txCard}>
                                <View style={styles.txHeader}>
                                    <Text style={styles.txNumber}>{idx + 1}</Text>
                                    <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                                </View>
                                <View style={styles.txBody}>
                                    <Text style={styles.txProduct}>
                                        {tx.productName || 'পণ্য'}{tx.quantity ? ` — ${tx.quantity} ${tx.unit || 'পিস'}` : ''}
                                    </Text>
                                    <View style={styles.txAmounts}>
                                        <View style={styles.txAmountItem}>
                                            <Text style={styles.txAmountLabel}>মোট</Text>
                                            <Text style={styles.txAmountValue}>{formatCurrency(tx.amount)}</Text>
                                        </View>
                                        <View style={styles.txAmountItem}>
                                            <Text style={styles.txAmountLabel}>পরিশোধ</Text>
                                            <Text style={[styles.txAmountValue, { color: COLORS.success }]}>
                                                {formatCurrency(tx.paidAmount)}
                                            </Text>
                                        </View>
                                        <View style={styles.txAmountItem}>
                                            <Text style={styles.txAmountLabel}>বাকি</Text>
                                            <Text style={[styles.txAmountValue, { color: COLORS.error }]}>
                                                {formatCurrency(tx.dueAmount)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Total */}
                        <View style={styles.totalBar}>
                            <Text style={styles.totalLabel}>সর্বমোট বাকি</Text>
                            <Text style={styles.totalAmount}>{formatCurrency(overdue.totalDue)}</Text>
                        </View>
                    </View>
                )}

                {/* Expand indicator */}
                <View style={styles.expandIndicator}>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={COLORS.textMuted}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>বাকির নোটিফিকেশন</Text>
                {unreadCount > 0 && (
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }} />
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>সব পড়া হয়েছে</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Settings Bar */}
            <View style={styles.settingsBar}>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>নোটিফিকেশন</Text>
                    <Switch
                        value={isEnabled}
                        onValueChange={toggleEnabled}
                        trackColor={{ false: COLORS.gray300, true: COLORS.primary + '50' }}
                        thumbColor={isEnabled ? COLORS.primary : COLORS.gray400}
                    />
                </View>
                <View style={styles.freqRow}>
                    {FREQ_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.key}
                            style={[styles.freqBtn, frequency === opt.key && styles.freqBtnActive]}
                            onPress={() => setFrequency(opt.key)}
                        >
                            <Text style={[styles.freqText, frequency === opt.key && styles.freqTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Summary */}
            {notifications.length > 0 && (
                <View style={styles.summaryBar}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{notifications.length} জন</Text>
                        <Text style={styles.summaryLabel}>বাকিদার</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.error }]}>
                            {formatCurrency(notifications.reduce((s, n) => s + n.totalDue, 0))}
                        </Text>
                        <Text style={styles.summaryLabel}>মোট বাকি</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{unreadCount}</Text>
                        <Text style={styles.summaryLabel}>নতুন</Text>
                    </View>
                </View>
            )}

            {/* Notification List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={80} color={COLORS.success} />
                        <Text style={styles.emptyTitle}>কোনো বাকি নেই! 🎉</Text>
                        <Text style={styles.emptySub}>সব গ্রাহক তাদের বাকি পরিশোধ করেছেন</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        backgroundColor: COLORS.white, ...SHADOWS.sm,
    },
    backBtn: { marginRight: SPACING.sm },
    title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary },
    headerBadge: {
        backgroundColor: COLORS.error, borderRadius: 10,
        paddingHorizontal: 7, paddingVertical: 1, marginLeft: SPACING.xs,
    },
    headerBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
    markAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    markAllText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600' },
    settingsBar: {
        backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    freqRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs },
    freqBtn: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray100,
    },
    freqBtnActive: { backgroundColor: COLORS.primary },
    freqText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '500' },
    freqTextActive: { color: COLORS.white },
    summaryBar: {
        flexDirection: 'row', backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg, marginTop: SPACING.md,
        borderRadius: BORDER_RADIUS.md, padding: SPACING.md, ...SHADOWS.sm,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.textPrimary },
    summaryLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
    summaryDivider: { width: 1, backgroundColor: COLORS.gray200 },
    list: { padding: SPACING.lg, paddingBottom: 40 },
    card: {
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOWS.sm,
        borderLeftWidth: 3, borderLeftColor: 'transparent',
    },
    cardUnread: { borderLeftWidth: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
    severityIcon: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    cardInfo: { flex: 1, marginLeft: SPACING.sm },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    contactName: { fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
    textBold: { fontWeight: 'bold' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
    meta: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    dueSection: { alignItems: 'flex-end', marginLeft: SPACING.xs },
    dueAmount: { fontSize: FONT_SIZES.md, fontWeight: 'bold' },
    severityBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginTop: 2 },
    severityText: { fontSize: 9, fontWeight: '700' },
    expandedBody: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
    divider: { height: 1, backgroundColor: COLORS.gray100, marginBottom: SPACING.sm },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
    contactPhone: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    breakdownHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs,
    },
    breakdownTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary },
    breakdownCount: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    txCard: {
        backgroundColor: COLORS.gray50 || COLORS.background, borderRadius: BORDER_RADIUS.sm,
        padding: SPACING.sm, marginBottom: SPACING.xs,
    },
    txHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 },
    txNumber: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary + '15',
        textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '700', color: COLORS.primary,
    },
    txDate: { fontSize: 11, color: COLORS.textMuted },
    txBody: {},
    txProduct: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 4 },
    txAmounts: { flexDirection: 'row', gap: SPACING.md },
    txAmountItem: { alignItems: 'center' },
    txAmountLabel: { fontSize: 9, color: COLORS.textMuted },
    txAmountValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    totalBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: SPACING.sm, borderTopWidth: 2, borderTopColor: COLORS.error + '30',
        marginTop: SPACING.xs,
    },
    totalLabel: { fontSize: FONT_SIZES.base, fontWeight: 'bold', color: COLORS.textPrimary },
    totalAmount: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.error },
    expandIndicator: { alignItems: 'center', paddingBottom: 6 },
    emptyState: { alignItems: 'center', paddingTop: 100 },
    emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: SPACING.lg },
    emptySub: { fontSize: FONT_SIZES.base, color: COLORS.textMuted, marginTop: SPACING.xs },
});
