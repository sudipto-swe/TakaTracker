/**
 * Reports Screen - Advanced business reports with charts, product analytics, and insights.
 * All strings use t() for i18n. useLanguage() triggers re-render on language switch.
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTransactionStore } from '../../store/transactionStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';

/* ─── Bar Chart ─── */
const BarChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string }> = ({ data, title }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={c.card}>
            <Text style={c.cardTitle}>{title}</Text>
            <View style={c.barArea}>
                {data.map((item, i) => {
                    const h = (item.value / max) * 130;
                    return (
                        <View key={i} style={c.barCol}>
                            <Text style={c.barVal}>{item.value >= 1000 ? `${Math.round(item.value / 1000)}k` : item.value || '0'}</Text>
                            <View style={[c.bar, { height: Math.max(h, 4), backgroundColor: item.color }]} />
                            <Text style={c.barLbl}>{item.label}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

/* ─── Stacked proportional bar ─── */
const ProportionBar: React.FC<{ data: { label: string; value: number; color: string }[]; title: string }> = ({ data, title }) => {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    return (
        <View style={c.card}>
            <Text style={c.cardTitle}>{title}</Text>
            <View style={c.propBar}>
                {data.map((item, i) => (
                    <View key={i} style={[c.propSeg, { width: `${Math.max((item.value / total) * 100, 2)}%` as any, backgroundColor: item.color, borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === data.length - 1 ? 8 : 0, borderBottomRightRadius: i === data.length - 1 ? 8 : 0 }]} />
                ))}
            </View>
            <View style={c.legend}>
                {data.map((item, i) => (
                    <View key={i} style={c.legendRow}>
                        <View style={[c.legendDot, { backgroundColor: item.color }]} />
                        <Text style={c.legendLbl}>{item.label}</Text>
                        <Text style={c.legendVal}>{formatCurrency(item.value)} ({Math.round((item.value / total) * 100)}%)</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

/* ─── Horizontal bar ranking ─── */
const RankingChart: React.FC<{ items: { label: string; value: number; sub?: string }[]; title: string; color: string; unit?: string; icon?: string }> = ({ items, title, color, unit, icon }) => {
    const max = Math.max(...items.map(i => i.value), 1);
    return (
        <View style={c.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
                {icon && <Ionicons name={icon as any} size={20} color={color} />}
                <Text style={c.cardTitle}>{title}</Text>
            </View>
            {items.map((item, i) => (
                <View key={i} style={c.rankRow}>
                    <View style={c.rankLeft}>
                        <View style={[c.rankBadge, { backgroundColor: i === 0 ? color : COLORS.gray200 }]}>
                            <Text style={[c.rankNum, { color: i === 0 ? COLORS.white : COLORS.textPrimary }]}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={c.rankName}>{item.label}</Text>
                            {item.sub && <Text style={c.rankSub}>{item.sub}</Text>}
                        </View>
                    </View>
                    <View style={c.rankRight}>
                        <Text style={[c.rankVal, { color }]}>{unit === '৳' ? formatCurrency(item.value) : `${item.value}`}{unit && unit !== '৳' ? ` ${unit}` : ''}</Text>
                        <View style={c.rankBarBg}>
                            <View style={[c.rankBarFill, { width: `${(item.value / max) * 100}%` as any, backgroundColor: color }]} />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
};

/* ─── Trend mini-bars ─── */
const TrendLine: React.FC<{ data: { label: string; value: number }[]; color: string; title: string }> = ({ data, color, title }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={c.card}>
            <Text style={c.cardTitle}>{title}</Text>
            <View style={c.trendArea}>
                {data.map((item, i) => (
                    <View key={i} style={c.trendCol}>
                        <View style={[c.trendBar, { height: Math.max((item.value / max) * 55, 3), backgroundColor: color }]} />
                        <Text style={c.trendLbl}>{item.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

/* ─── Metric Card ─── */
const MetricCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
    <View style={[c.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <Ionicons name={icon as any} size={22} color={color} />
        <Text style={c.metricLabel}>{label}</Text>
        <Text style={[c.metricValue, { color }]}>{value}</Text>
    </View>
);

/* ═══════════════════ Main Screen ═══════════════════ */
export const ReportsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { language } = useLanguage(); // triggers re-render on language change
    const [activePeriod, setActivePeriod] = useState('month');
    const { transactions } = useTransactionStore();
    const { products, getTopSellingProducts, getMostDemandedProducts, getInventoryValuation, getCategoryBreakdown } = useInventoryStore();

    const REPORT_PERIODS = [
        { key: 'today', label: t('reports.periodToday') },
        { key: 'week', label: t('reports.periodWeek') },
        { key: 'month', label: t('reports.periodMonth') },
    ];

    /* ─── Transaction Stats ─── */
    const reportData = useMemo(() => {
        const now = new Date();
        const filterByPeriod = (period: string) => {
            return transactions.filter(tx => {
                const d = new Date(tx.date);
                if (period === 'today') return d.toDateString() === now.toDateString();
                if (period === 'week') return d >= new Date(now.getTime() - 7 * 86400000);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        };
        const compute = (filtered: typeof transactions) => {
            let sales = 0, purchases = 0, expenses = 0, receivable = 0, payable = 0, netProfit = 0;
            for (const tx of filtered) {
                switch (tx.type) {
                    case 'sale':
                        sales += tx.amount;
                        receivable += tx.dueAmount;
                        netProfit += (tx.quantity || 0) * ((tx.unitSellPrice || 0) - (tx.unitBuyPrice || 0));
                        break;
                    case 'purchase': purchases += tx.amount; payable += tx.dueAmount; break;
                    case 'expense': expenses += tx.amount; netProfit -= tx.amount; break;
                }
            }
            return { sales, purchases, expenses, profit: netProfit, transactions: filtered.length, receivable, payable };
        };
        return { today: compute(filterByPeriod('today')), week: compute(filterByPeriod('week')), month: compute(filterByPeriod('month')) };
    }, [transactions]);

    const data = reportData[activePeriod as keyof typeof reportData];
    const hasData = data.transactions > 0;

    /* ─── Inventory Analytics ─── */
    const topSellers = getTopSellingProducts(5);
    const mostDemanded = getMostDemandedProducts(5);
    const valuation = getInventoryValuation();
    const categoryData = getCategoryBreakdown();

    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.lowStock);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    const avgMargin = products.length > 0
        ? Math.round(products.reduce((s, p) => s + (p.sellingPrice > 0 ? ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100 : 0), 0) / products.length)
        : 0;
    const totalProductsSold = products.reduce((s, p) => s + p.totalSold, 0);
    const totalRevenue = products.reduce((s, p) => s + p.totalRevenue, 0);
    const totalProfit = products.reduce((s, p) => s + p.totalProfit, 0);

    // Weekly trend (mini, using locale day names)
    const weekDaysEn = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const weekDaysBn = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'];
    const weekDays = language === 'bn' ? weekDaysBn : weekDaysEn;
    const weekTrend = weekDays.map((d) => ({
        label: d,
        value: Math.round((data.sales || 15000) / 7 * (0.5 + Math.random())),
    }));

    const handleExport = (format: string) => console.log(`Export: ${format}`);

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={s.title}>{t('reports.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Period */}
            <View style={s.periodRow}>
                {REPORT_PERIODS.map(p => (
                    <TouchableOpacity key={p.key} style={[s.periodTab, activePeriod === p.key && s.periodActive]} onPress={() => setActivePeriod(p.key)}>
                        <Text style={[s.periodText, activePeriod === p.key && s.periodActiveText]}>{p.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {!hasData && (
                    <View style={s.demoBanner}>
                        <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                        <Text style={s.demoBannerText}>{t('reports.demoNotice')}</Text>
                    </View>
                )}

                {/* ═══ Summary Cards ═══ */}
                <View style={s.grid}>
                    <MetricCard icon="trending-up" label={t('reports.totalSales')} value={formatCurrency(data.sales || 15000)} color={COLORS.success} />
                    <MetricCard icon="trending-down" label={t('reports.totalPurchases')} value={formatCurrency(data.purchases || 8000)} color={COLORS.error} />
                    <MetricCard icon="wallet-outline" label={t('reports.totalExpenses')} value={formatCurrency(data.expenses || 1500)} color={COLORS.warning} />
                    <MetricCard icon="stats-chart" label={t('reports.netProfit')} value={formatCurrency(data.profit || 5500)} color={(data.profit || 5500) >= 0 ? COLORS.success : COLORS.error} />
                </View>

                {/* ═══ Bar Chart ═══ */}
                <View style={s.section}>
                    <BarChart
                        title={t('reports.revenueVsExpense')}
                        data={[
                            { label: t('reports.salesLabel'), value: data.sales || 15000, color: COLORS.success },
                            { label: t('reports.purchasesLabel'), value: data.purchases || 8000, color: COLORS.error },
                            { label: t('reports.expensesLabel'), value: data.expenses || 1500, color: COLORS.warning },
                        ]}
                    />
                </View>

                {/* ═══ Proportion Chart ═══ */}
                <View style={s.section}>
                    <ProportionBar
                        title={t('reports.transactionBreakdown')}
                        data={[
                            { label: t('reports.salesLabel'), value: data.sales || 15000, color: COLORS.success },
                            { label: t('reports.purchasesLabel'), value: data.purchases || 8000, color: COLORS.error },
                            { label: t('reports.expensesLabel'), value: data.expenses || 1500, color: COLORS.warning },
                        ]}
                    />
                </View>

                {/* ═══ Weekly Trend ═══ */}
                <View style={s.section}>
                    <TrendLine data={weekTrend} color={COLORS.success} title={t('reports.weeklySalesTrend')} />
                </View>

                {/* ═══ TOP SELLING ═══ */}
                <View style={s.section}>
                    <RankingChart
                        title={t('reports.topSellingProducts')}
                        icon="trophy"
                        color="#FFB800"
                        unit="৳"
                        items={topSellers.map(p => ({ label: p.name, value: p.totalRevenue, sub: t('reports.soldCount', { count: p.salesCount }) + ` • ${t('inventory.profit')} ${formatCurrency(p.totalProfit)}` }))}
                    />
                </View>

                {/* ═══ MOST DEMANDED ═══ */}
                <View style={s.section}>
                    <RankingChart
                        title={t('reports.mostDemandedProducts')}
                        icon="flame"
                        color="#FF6B6B"
                        unit=""
                        items={mostDemanded.map(p => ({ label: p.name, value: p.totalSold, sub: t('reports.unitsSold', { unit: p.unit, count: p.salesCount }) }))}
                    />
                </View>

                {/* ═══ PROFIT MARGINS ═══ */}
                <View style={s.section}>
                    <RankingChart
                        title={t('reports.profitMargins')}
                        icon="analytics"
                        color={COLORS.primary}
                        unit="%"
                        items={[...products]
                            .sort((a, b) => {
                                const mA = a.sellingPrice > 0 ? ((a.sellingPrice - a.purchasePrice) / a.sellingPrice) * 100 : 0;
                                const mB = b.sellingPrice > 0 ? ((b.sellingPrice - b.purchasePrice) / b.sellingPrice) * 100 : 0;
                                return mB - mA;
                            })
                            .slice(0, 5)
                            .map(p => ({
                                label: p.name,
                                value: p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100) : 0,
                                sub: t('reports.buyToSell', { buy: formatCurrency(p.purchasePrice), sell: formatCurrency(p.sellingPrice) }),
                            }))
                        }
                    />
                </View>

                {/* ═══ INVENTORY VALUATION ═══ */}
                <View style={s.section}>
                    <View style={c.card}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
                            <Ionicons name="cube" size={20} color={COLORS.primary} />
                            <Text style={c.cardTitle}>{t('reports.inventoryValuation')}</Text>
                        </View>
                        <View style={s.valGrid}>
                            <View style={s.valItem}>
                                <Text style={s.valLabel}>{t('reports.atCost')}</Text>
                                <Text style={[s.valValue, { color: COLORS.error }]}>{formatCurrency(valuation.totalCost)}</Text>
                            </View>
                            <View style={s.valItem}>
                                <Text style={s.valLabel}>{t('reports.atRetail')}</Text>
                                <Text style={[s.valValue, { color: COLORS.primary }]}>{formatCurrency(valuation.totalRetail)}</Text>
                            </View>
                            <View style={s.valItem}>
                                <Text style={s.valLabel}>{t('reports.potentialProfit')}</Text>
                                <Text style={[s.valValue, { color: COLORS.success }]}>{formatCurrency(valuation.potentialProfit)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ═══ CATEGORY BREAKDOWN ═══ */}
                {categoryData.length > 0 && (
                    <View style={s.section}>
                        <View style={c.card}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
                                <Ionicons name="pie-chart" size={20} color={COLORS.warning} />
                                <Text style={c.cardTitle}>{t('reports.categoryBreakdown')}</Text>
                            </View>
                            {categoryData.map((cat, i) => {
                                const catColors = [COLORS.success, COLORS.error, COLORS.warning, COLORS.primary, '#4ECDC4', '#FF6B6B'];
                                return (
                                    <View key={i} style={s.catRow}>
                                        <View style={[s.catDot, { backgroundColor: catColors[i % catColors.length] }]} />
                                        <Text style={s.catName}>{cat.category}</Text>
                                        <Text style={s.catCount}>{t('reports.productsCount', { count: cat.count })}</Text>
                                        <Text style={[s.catVal, { color: catColors[i % catColors.length] }]}>{formatCurrency(cat.revenue)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ═══ LOW STOCK ALERTS ═══ */}
                {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                    <View style={s.section}>
                        <View style={c.card}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
                                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                                <Text style={c.cardTitle}>{t('reports.stockAlerts')}</Text>
                            </View>
                            {outOfStockProducts.map(p => (
                                <View key={p.id} style={[s.alertRow, { borderLeftColor: COLORS.error }]}>
                                    <Text style={s.alertName}>{p.name}</Text>
                                    <View style={[s.alertBadge, { backgroundColor: COLORS.error + '20' }]}>
                                        <Text style={[s.alertBadgeText, { color: COLORS.error }]}>{t('inventory.outOfStock')}</Text>
                                    </View>
                                </View>
                            ))}
                            {lowStockProducts.map(p => (
                                <View key={p.id} style={[s.alertRow, { borderLeftColor: COLORS.warning }]}>
                                    <Text style={s.alertName}>{p.name}</Text>
                                    <View style={[s.alertBadge, { backgroundColor: COLORS.warning + '20' }]}>
                                        <Text style={[s.alertBadgeText, { color: COLORS.warning }]}>{t('reports.remaining', { count: p.stock, unit: p.unit })}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ═══ BUSINESS HEALTH ═══ */}
                <View style={s.section}>
                    <View style={c.card}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
                            <Ionicons name="pulse" size={20} color={COLORS.success} />
                            <Text style={c.cardTitle}>{t('reports.businessHealth')}</Text>
                        </View>
                        <View style={s.healthGrid}>
                            <View style={s.healthItem}>
                                <Text style={s.healthVal}>{totalProductsSold}</Text>
                                <Text style={s.healthLbl}>{t('reports.totalProductsSold')}</Text>
                            </View>
                            <View style={s.healthItem}>
                                <Text style={[s.healthVal, { color: COLORS.success }]}>{formatCurrency(totalRevenue)}</Text>
                                <Text style={s.healthLbl}>{t('reports.totalRevenue')}</Text>
                            </View>
                            <View style={s.healthItem}>
                                <Text style={[s.healthVal, { color: COLORS.primary }]}>{formatCurrency(totalProfit)}</Text>
                                <Text style={s.healthLbl}>{t('reports.totalProfit')}</Text>
                            </View>
                            <View style={s.healthItem}>
                                <Text style={[s.healthVal, { color: COLORS.warning }]}>{avgMargin}%</Text>
                                <Text style={s.healthLbl}>{t('reports.avgMargin')}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ═══ DUES ═══ */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('reports.duesSummary')}</Text>
                    <View style={s.duesRow}>
                        <View style={[s.dueCard, { borderLeftColor: COLORS.receivable }]}>
                            <Ionicons name="arrow-down-circle" size={22} color={COLORS.receivable} />
                            <Text style={s.dueLabel}>{t('reports.receivableLabel')}</Text>
                            <Text style={[s.dueValue, { color: COLORS.receivable }]}>{formatCurrency(data.receivable || 5000)}</Text>
                        </View>
                        <View style={[s.dueCard, { borderLeftColor: COLORS.payable }]}>
                            <Ionicons name="arrow-up-circle" size={22} color={COLORS.payable} />
                            <Text style={s.dueLabel}>{t('reports.payableLabel')}</Text>
                            <Text style={[s.dueValue, { color: COLORS.payable }]}>{formatCurrency(data.payable || 2000)}</Text>
                        </View>
                    </View>
                </View>

                {/* ═══ STATS TABLE ═══ */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('reports.transactionStats')}</Text>
                    <View style={c.card}>
                        {[
                            { l: t('reports.totalTransactions'), v: `${data.transactions || 12}` },
                            { l: t('reports.avgSale'), v: formatCurrency(Math.round((data.sales || 15000) / Math.max(data.transactions || 12, 1))) },
                            { l: t('reports.profitRate'), v: `${(data.sales || 15000) > 0 ? Math.round(((data.profit || 5500) / (data.sales || 15000)) * 100) : 0}%` },
                        ].map((row, i) => (
                            <View key={i}>
                                <View style={s.statRow}>
                                    <Text style={s.statLbl}>{row.l}</Text>
                                    <Text style={s.statVal}>{row.v}</Text>
                                </View>
                                {i < 2 && <View style={s.statDiv} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* ═══ EXPORT ═══ */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('reports.downloadReports')}</Text>
                    <View style={s.exportRow}>
                        <TouchableOpacity style={[s.exportBtn, { backgroundColor: COLORS.error }]} onPress={() => handleExport('pdf')}>
                            <Ionicons name="document-text" size={20} color={COLORS.white} />
                            <Text style={s.exportText}>{t('reports.exportPdf')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.exportBtn, { backgroundColor: COLORS.success }]} onPress={() => handleExport('excel')}>
                            <Ionicons name="grid" size={20} color={COLORS.white} />
                            <Text style={s.exportText}>{t('reports.exportExcel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

/* ─── Chart component styles ─── */
const c = StyleSheet.create({
    card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
    cardTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
    barArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 170, paddingTop: SPACING.md },
    barCol: { alignItems: 'center', flex: 1 },
    bar: { width: 28, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
    barVal: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
    barLbl: { fontSize: 10, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },
    propBar: { flexDirection: 'row', height: 22, borderRadius: 8, overflow: 'hidden', marginBottom: SPACING.md },
    propSeg: { height: '100%' },
    legend: { gap: SPACING.sm },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendLbl: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    legendVal: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    trendArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 90, paddingTop: SPACING.sm },
    trendCol: { alignItems: 'center', flex: 1 },
    trendBar: { width: 18, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    trendLbl: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },
    metricCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
    metricLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
    metricValue: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', marginTop: SPACING.xs },
    rankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    rankLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
    rankBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    rankNum: { fontSize: 12, fontWeight: 'bold' },
    rankName: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textPrimary },
    rankSub: { fontSize: 10, color: COLORS.textMuted },
    rankRight: { alignItems: 'flex-end', minWidth: 100 },
    rankVal: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
    rankBarBg: { height: 4, width: 80, backgroundColor: COLORS.gray100, borderRadius: 2, marginTop: 3 },
    rankBarFill: { height: '100%', borderRadius: 2 },
});

/* ─── Screen styles ─── */
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    title: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    periodRow: { flexDirection: 'row', backgroundColor: COLORS.white, padding: SPACING.md, gap: SPACING.sm },
    periodTab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.gray100 },
    periodActive: { backgroundColor: COLORS.primary },
    periodText: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textSecondary },
    periodActiveText: { color: COLORS.white },
    demoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10', marginHorizontal: SPACING.lg, marginTop: SPACING.md, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, gap: SPACING.xs },
    demoBannerText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.primary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.lg, gap: SPACING.md },
    section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
    sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md },
    valGrid: { flexDirection: 'row', gap: SPACING.md },
    valItem: { flex: 1, alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
    valLabel: { fontSize: 10, color: COLORS.textMuted },
    valValue: { fontSize: FONT_SIZES.sm, fontWeight: 'bold', marginTop: 2 },
    catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: SPACING.sm },
    catDot: { width: 10, height: 10, borderRadius: 5 },
    catName: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
    catCount: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    catVal: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
    alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm, paddingLeft: SPACING.sm, borderLeftWidth: 3, marginBottom: SPACING.xs },
    alertName: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, flex: 1 },
    alertBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
    alertBadgeText: { fontSize: 10, fontWeight: '600' },
    healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    healthItem: { width: '45%', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
    healthVal: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.textPrimary },
    healthLbl: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
    duesRow: { flexDirection: 'row', gap: SPACING.md },
    dueCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderLeftWidth: 4, ...SHADOWS.sm },
    dueLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
    dueValue: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', marginTop: SPACING.xs },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
    statLbl: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary },
    statVal: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
    statDiv: { height: 1, backgroundColor: COLORS.gray100 },
    exportRow: { flexDirection: 'row', gap: SPACING.md },
    exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm },
    exportText: { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: '600' },
});
