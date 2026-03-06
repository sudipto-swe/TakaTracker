/**
 * Dashboard Screen - Summary, quick actions, heatmap, and recent transactions.
 */
import React, { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../../store/authStore';
import { useTransactionStore, Transaction, getDailySales, computeAllTimeProfit } from '../../store/transactionStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useSyncStore } from '../../store/syncStore';
import { backgroundSync } from '../../services/syncService';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageContext';

// ─── Heatmap Component ───
const HEATMAP_WEEKS = 18;
const HEATMAP_DAYS = HEATMAP_WEEKS * 7;
const CELL_SIZE = 14;
const CELL_GAP = 3;

const DAY_LABELS = ['শ', 'র', 'ম', 'বু', 'বৃ', 'শু', 'শ'];

const getHeatColor = (value: number, max: number): string => {
    if (value === 0) return COLORS.gray100;
    const ratio = Math.min(value / (max || 1), 1);
    if (ratio < 0.25) return '#c6e48b';
    if (ratio < 0.5) return '#7bc96f';
    if (ratio < 0.75) return '#239a3b';
    return '#196127';
};

const SalesHeatmap: React.FC<{ dailySales: Record<string, number> }> = ({ dailySales }) => {
    const entries = Object.entries(dailySales);
    const values = entries.map(([, v]) => v);
    const maxSale = Math.max(...values, 1);

    // Build grid: 7 rows (days) × N columns (weeks)
    const weeks: { key: string; value: number }[][] = [];
    let currentWeek: { key: string; value: number }[] = [];

    // Find start day of week for alignment
    const firstDate = entries.length > 0 ? new Date(entries[0][0]) : new Date();
    const startDayOfWeek = firstDate.getDay(); // 0=Sun

    // Pad the beginning
    for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push({ key: `pad-${i}`, value: -1 });
    }

    entries.forEach(([key, value]) => {
        currentWeek.push({ key, value });
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push({ key: `pad-end-${currentWeek.length}`, value: -1 });
        }
        weeks.push(currentWeek);
    }

    // Month labels
    const monthLabels: { label: string; col: number }[] = [];
    const months = ['জানু', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ', 'অক্টো', 'নভে', 'ডিসে'];
    let lastMonth = -1;
    entries.forEach(([key], idx) => {
        const month = new Date(key).getMonth();
        if (month !== lastMonth) {
            const weekCol = Math.floor((idx + startDayOfWeek) / 7);
            monthLabels.push({ label: months[month], col: weekCol });
            lastMonth = month;
        }
    });

    return (
        <View style={heatStyles.container}>
            <View style={heatStyles.headerRow}>
                <Text style={heatStyles.title}>বিক্রয় হিটম্যাপ</Text>
                <View style={heatStyles.legend}>
                    <Text style={heatStyles.legendText}>কম</Text>
                    {['#c6e48b', '#7bc96f', '#239a3b', '#196127'].map((c, i) => (
                        <View key={i} style={[heatStyles.legendCell, { backgroundColor: c }]} />
                    ))}
                    <Text style={heatStyles.legendText}>বেশি</Text>
                </View>
            </View>

            {/* Month labels */}
            <View style={[heatStyles.monthRow, { marginLeft: 22 }]}>
                {monthLabels.map((m, i) => (
                    <Text
                        key={i}
                        style={[heatStyles.monthLabel, { position: 'absolute', left: m.col * (CELL_SIZE + CELL_GAP) }]}
                    >
                        {m.label}
                    </Text>
                ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={heatStyles.gridContainer}>
                    {/* Day labels */}
                    <View style={heatStyles.dayLabels}>
                        {DAY_LABELS.map((label, i) => (
                            <Text key={i} style={[heatStyles.dayLabel, { height: CELL_SIZE, lineHeight: CELL_SIZE }]}>
                                {i % 2 === 1 ? label : ''}
                            </Text>
                        ))}
                    </View>

                    {/* Cells */}
                    <View style={heatStyles.grid}>
                        {weeks.map((week, wi) => (
                            <View key={wi} style={heatStyles.column}>
                                {week.map((day) => (
                                    <View
                                        key={day.key}
                                        style={[
                                            heatStyles.cell,
                                            {
                                                backgroundColor: day.value < 0 ? 'transparent' : getHeatColor(day.value, maxSale),
                                                width: CELL_SIZE,
                                                height: CELL_SIZE,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const heatStyles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.xl,
        ...SHADOWS.sm,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    title: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    legendText: { fontSize: 9, color: COLORS.textMuted },
    legendCell: { width: 10, height: 10, borderRadius: 2 },
    monthRow: { height: 16, position: 'relative', marginBottom: 4 },
    monthLabel: { fontSize: 9, color: COLORS.textMuted, position: 'absolute' },
    gridContainer: { flexDirection: 'row' },
    dayLabels: { justifyContent: 'space-between', marginRight: 4, gap: CELL_GAP },
    dayLabel: { fontSize: 9, color: COLORS.textMuted, width: 16, textAlign: 'right' },
    grid: { flexDirection: 'row', gap: CELL_GAP },
    column: { gap: CELL_GAP },
    cell: { borderRadius: 2 },
});

// ─── Dashboard ───
export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { language } = useLanguage();
    const { user } = useAuthStore();
    const { transactions, todaySummary } = useTransactionStore();
    const { isOnline, pendingCount } = useSyncStore();

    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await backgroundSync.triggerSync();
        } catch (e) {
            console.warn('[Dashboard] Sync on refresh failed:', e);
        }
        setIsRefreshing(false);
    };

    const summary = todaySummary;

    const allTimeProfit = useMemo(() => computeAllTimeProfit(transactions), [transactions]);
    const dailySales = useMemo(() => getDailySales(transactions, HEATMAP_DAYS), [transactions]);

    const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

    // Low stock products
    const { getLowStockProducts } = useInventoryStore();
    const lowStockProducts = useMemo(() => getLowStockProducts(), [getLowStockProducts]);

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            sale: t('transactions.sale'),
            purchase: t('transactions.purchase'),
            expense: t('transactions.expense'),
        };
        return labels[type] || type;
    };

    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const txDate = new Date(date);
        const diff = now.getTime() - txDate.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t('dashboard.justNow');
        if (minutes < 60) return t('dashboard.minutesAgo', { count: minutes });
        if (hours < 24) return t('dashboard.hoursAgo', { count: hours });
        return t('dashboard.daysAgo', { count: days });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{t('auth.welcomeBack')}</Text>
                    <Text style={styles.businessName}>
                        {user?.businessName || user?.name || t('auth.businessName')}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={[styles.syncBadge, isOnline ? styles.online : styles.offline]}>
                        <View style={[styles.syncDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
                        <Text style={styles.syncText}>
                            {isOnline ? t('settings.online') : t('settings.offline')}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
                        {pendingCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>{pendingCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Low Stock Warning Banner */}
                {lowStockProducts.length > 0 && (
                    <TouchableOpacity
                        style={styles.lowStockBanner}
                        onPress={() => navigation.navigate('Inventory' as never)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.lowStockBannerLeft}>
                            <Ionicons name="warning" size={20} color="#f59e0b" />
                            <View style={{ marginLeft: SPACING.sm }}>
                                <Text style={styles.lowStockBannerTitle}>
                                    ⚠️ {lowStockProducts.length}টি পণ্যে স্টক কম!
                                </Text>
                                <Text style={styles.lowStockBannerSub} numberOfLines={1}>
                                    {lowStockProducts.slice(0, 2).map(p => `${p.name} (${p.stock})`).join(', ')}
                                    {lowStockProducts.length > 2 ? ` +${lowStockProducts.length - 2} আরো` : ''}
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#92400e" />
                    </TouchableOpacity>
                )}

                {/* Today's Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryTitle}>{t('dashboard.todaySummary')}</Text>
                        <Text style={styles.summaryDate}>{t('common.today')}</Text>
                    </View>

                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>{t('dashboard.totalSales')}</Text>
                            <Text style={[styles.summaryValue, styles.greenText]}>
                                {formatCurrency(summary.totalSales)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>{t('dashboard.totalPurchases')}</Text>
                            <Text style={[styles.summaryValue, styles.redText]}>
                                {formatCurrency(summary.totalPurchases)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>খরচ</Text>
                            <Text style={[styles.summaryValue, styles.redText]}>
                                {formatCurrency(summary.totalExpenses)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>লেনদেন</Text>
                            <Text style={[styles.summaryValue, { color: COLORS.white }]}>
                                {summary.transactionCount}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.profitRow}>
                        <Text style={styles.profitLabel}>আজকের নিট লাভ</Text>
                        <Text style={[styles.profitValue, summary.netProfit < 0 && { color: '#FFB6C1' }]}>
                            {summary.netProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(summary.netProfit))}
                        </Text>
                    </View>
                </View>

                {/* All-time profit */}
                <View style={styles.allTimeProfitCard}>
                    <Ionicons name="trending-up" size={20} color={allTimeProfit >= 0 ? COLORS.success : COLORS.error} />
                    <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                        <Text style={styles.allTimeProfitLabel}>মোট নিট লাভ</Text>
                        <Text style={[styles.allTimeProfitValue, { color: allTimeProfit >= 0 ? COLORS.success : COLORS.error }]}>
                            {allTimeProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(allTimeProfit))}
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
                    <View style={styles.quickActionsGrid}>
                        <QuickActionButton
                            icon="arrow-up-circle"
                            label={t('transactions.sale')}
                            color={COLORS.success}
                            onPress={() => navigation.navigate('AddTransaction')}
                        />
                        <QuickActionButton
                            icon="arrow-down-circle"
                            label={t('transactions.purchase')}
                            color={COLORS.error}
                            onPress={() => navigation.navigate('AddTransaction')}
                        />
                        <QuickActionButton
                            icon="trending-down"
                            label={t('transactions.expense')}
                            color={COLORS.warning}
                            onPress={() => navigation.navigate('AddTransaction')}
                        />
                        <QuickActionButton
                            icon="cube-outline"
                            label="ইনভেন্টরি"
                            color={COLORS.primary}
                            onPress={() => navigation.navigate('Inventory')}
                        />
                    </View>
                </View>

                {/* Heatmap */}
                <SalesHeatmap dailySales={dailySales} />

                {/* Dues Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('contacts.dues')}</Text>
                    </View>

                    <View style={styles.duesContainer}>
                        <View style={[styles.dueCard, styles.receivableCard]}>
                            <Ionicons name="arrow-down" size={24} color={COLORS.receivable} />
                            <Text style={styles.dueLabel}>{t('dashboard.receivable')}</Text>
                            <Text style={[styles.dueAmount, { color: COLORS.receivable }]}>
                                {formatCurrency(summary.receivable)}
                            </Text>
                        </View>

                        <View style={[styles.dueCard, styles.payableCard]}>
                            <Ionicons name="arrow-up" size={24} color={COLORS.payable} />
                            <Text style={styles.dueLabel}>{t('dashboard.payable')}</Text>
                            <Text style={[styles.dueAmount, { color: COLORS.payable }]}>
                                {formatCurrency(summary.payable)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
                    </View>

                    <View style={styles.transactionsList}>
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx: Transaction) => (
                                <TransactionItem
                                    key={tx.id}
                                    type={tx.type}
                                    name={tx.productName || tx.contactName || getTypeLabel(tx.type)}
                                    amount={tx.amount}
                                    time={getTimeAgo(tx.date)}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="receipt-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyText}>
                                    {t('dashboard.noTransactions')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Quick Action Button Component
const QuickActionButton: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    onPress?: () => void;
}> = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.7} onPress={onPress}>
        <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
);

// Transaction Item Component
const TransactionItem: React.FC<{
    type: string;
    name: string;
    amount: number;
    time: string;
}> = ({ type, name, amount, time }) => {
    const isIncome = type === 'sale';

    return (
        <View style={styles.transactionItem}>
            <View style={[
                styles.transactionIcon,
                { backgroundColor: isIncome ? COLORS.success + '15' : COLORS.error + '15' }
            ]}>
                <Ionicons
                    name={isIncome ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={isIncome ? COLORS.success : COLORS.error}
                />
            </View>
            <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{name}</Text>
                <Text style={styles.transactionTime}>{time}</Text>
            </View>
            <Text style={[
                styles.transactionAmount,
                { color: isIncome ? COLORS.success : COLORS.error }
            ]}>
                {isIncome ? '+' : '-'}{formatCurrency(amount)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    greeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    businessName: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    syncBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full, gap: 4,
    },
    online: { backgroundColor: COLORS.success + '15' },
    offline: { backgroundColor: COLORS.warning + '15' },
    syncDot: { width: 6, height: 6, borderRadius: 3 },
    onlineDot: { backgroundColor: COLORS.success },
    offlineDot: { backgroundColor: COLORS.warning },
    syncText: { fontSize: FONT_SIZES.xs, fontWeight: '500', color: COLORS.textSecondary },
    notificationButton: { position: 'relative', padding: SPACING.xs },
    notificationBadge: {
        position: 'absolute', top: 0, right: 0,
        backgroundColor: COLORS.error, borderRadius: 10, width: 18, height: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    notificationBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
    scrollView: { flex: 1 },
    scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.lg },
    summaryCard: {
        backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.lg,
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
    summaryTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.white },
    summaryDate: { fontSize: FONT_SIZES.sm, color: COLORS.white + 'AA' },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.md },
    summaryItem: {
        width: '47%', backgroundColor: COLORS.white + '15',
        borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    },
    summaryLabel: { fontSize: FONT_SIZES.xs, color: COLORS.white + 'CC', marginBottom: SPACING.xs },
    summaryValue: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.white },
    greenText: { color: '#90EE90' },
    redText: { color: '#FFB6C1' },
    profitRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.white + '30',
    },
    profitLabel: { fontSize: FONT_SIZES.md, color: COLORS.white },
    profitValue: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: '#90EE90' },
    allTimeProfitCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOWS.sm,
    },
    allTimeProfitLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
    allTimeProfitValue: { fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
    section: { marginBottom: SPACING.xl },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md,
    },
    sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    quickActionButton: { width: '22%', alignItems: 'center' },
    quickActionIcon: {
        width: 56, height: 56, borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs,
    },
    quickActionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
    duesContainer: { flexDirection: 'row', gap: SPACING.md },
    dueCard: {
        flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm,
    },
    receivableCard: { borderLeftWidth: 3, borderLeftColor: COLORS.receivable },
    payableCard: { borderLeftWidth: 3, borderLeftColor: COLORS.payable },
    dueLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
    dueAmount: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', marginTop: SPACING.xs },
    transactionsList: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.sm },
    transactionItem: {
        flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    transactionIcon: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
    },
    transactionInfo: { flex: 1 },
    transactionName: { fontSize: FONT_SIZES.base, fontWeight: '500', color: COLORS.textPrimary },
    transactionTime: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    transactionAmount: { fontSize: FONT_SIZES.base, fontWeight: '600' },
    emptyState: { alignItems: 'center', padding: SPACING.xl },
    emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.md },
    lowStockBanner: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fbbf24',
        borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
    },
    lowStockBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    lowStockBannerTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#92400e' },
    lowStockBannerSub: { fontSize: FONT_SIZES.xs, color: '#b45309', marginTop: 2 },
});
