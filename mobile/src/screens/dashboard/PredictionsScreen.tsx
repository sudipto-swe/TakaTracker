/**
 * PredictionsScreen - Full predictions with tabs for trending, seasonal, combo, forecast.
 * All strings use t() for i18n support.
 */
import React, { useState, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';
import { useInventoryStore } from '../../store/inventoryStore';
import { useTransactionStore } from '../../store/transactionStore';
import { getFullPredictions, FullPredictions } from '../../services/predictionService';
import { useNavigation } from '@react-navigation/native';

export const PredictionsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'trending' | 'season' | 'combo' | 'forecast'>('trending');
    const products = useInventoryStore(s => s.products);
    const salesHistory = useInventoryStore(s => s.salesHistory);
    const transactions = useTransactionStore(s => s.transactions);

    const predictions = useMemo(() => {
        return getFullPredictions(products, salesHistory, transactions);
    }, [products, salesHistory, transactions]);

    const tabs = [
        { key: 'trending' as const, label: t('smart.trending'), icon: 'trending-up' as const },
        { key: 'season' as const, label: t('smart.season'), icon: 'calendar-outline' as const },
        { key: 'combo' as const, label: t('smart.combo'), icon: 'pricetags-outline' as const },
        { key: 'forecast' as const, label: t('smart.forecast'), icon: 'analytics-outline' as const },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('smart.predictions')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabRow}>
                {tabs.map(tab => (
                    <TouchableOpacity key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}>
                        <Ionicons name={tab.icon} size={16}
                            color={activeTab === tab.key ? COLORS.white : COLORS.textMuted} />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'trending' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('smart.trendingProducts')}</Text>
                        <Text style={styles.sectionDesc}>{t('smart.trendingDesc')}</Text>
                        {predictions.trending.length > 0 ? predictions.trending.map((item, i) => (
                            <View key={i} style={styles.card}>
                                <View style={styles.cardRow}>
                                    <View style={[styles.rankCircle, i < 3 && { backgroundColor: COLORS.warning + '20' }]}>
                                        <Text style={[styles.rankNum, i < 3 && { color: COLORS.warning }]}>#{i + 1}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{item.productName}</Text>
                                        <Text style={styles.cardMeta}>
                                            {item.avgDailySales.toFixed(1)} {t('smart.unitsPerDay')}
                                        </Text>
                                    </View>
                                    <View style={[styles.trendBadge, {
                                        backgroundColor: item.trend === 'rising' ? COLORS.success + '15' : item.trend === 'falling' ? COLORS.error + '15' : COLORS.gray100
                                    }]}>
                                        <Ionicons
                                            name={item.trend === 'rising' ? 'arrow-up' : item.trend === 'falling' ? 'arrow-down' : 'remove'}
                                            size={14}
                                            color={item.trend === 'rising' ? COLORS.success : item.trend === 'falling' ? COLORS.error : COLORS.textMuted}
                                        />
                                        <Text style={{
                                            fontSize: 12, fontWeight: '600',
                                            color: item.trend === 'rising' ? COLORS.success : item.trend === 'falling' ? COLORS.error : COLORS.textMuted
                                        }}>
                                            {item.trendPercent > 0 ? '+' : ''}{item.trendPercent.toFixed(0)}%
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="trending-up-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyText}>{t('smart.trendingEmpty')}</Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'season' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('smart.seasonalPredictions')}</Text>
                        <Text style={styles.sectionDesc}>{t('smart.seasonalDesc')}</Text>
                        {predictions.seasonal.length > 0 ? predictions.seasonal.map((item, i) => (
                            <View key={i} style={styles.card}>
                                <View style={styles.cardRow}>
                                    <View style={[styles.seasonIcon, { backgroundColor: item.isActive ? COLORS.success + '15' : COLORS.warning + '15' }]}>
                                        <Ionicons name="calendar" size={20}
                                            color={item.isActive ? COLORS.success : COLORS.warning} />
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <View style={styles.seasonHeader}>
                                            <Text style={styles.cardTitle}>{item.season}</Text>
                                            <View style={[styles.statusBadge, {
                                                backgroundColor: item.isActive ? COLORS.success + '15' : COLORS.warning + '15'
                                            }]}>
                                                <Text style={{
                                                    fontSize: 10, fontWeight: '600',
                                                    color: item.isActive ? COLORS.success : COLORS.warning
                                                }}>
                                                    {item.isActive ? t('smart.seasonActive') : t('smart.seasonUpcoming')}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.cardMeta}>{item.products.join(', ')}</Text>
                                    </View>
                                </View>
                            </View>
                        )) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="calendar-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyText}>{t('smart.noSeasonalData')}</Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'combo' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('smart.comboSuggestions')}</Text>
                        <Text style={styles.sectionDesc}>{t('smart.comboDesc')}</Text>
                        {predictions.combos.length > 0 ? predictions.combos.map((item, i) => (
                            <View key={i} style={styles.card}>
                                <View style={styles.comboHeader}>
                                    <Ionicons name="pricetags" size={18} color={COLORS.accent} />
                                    <Text style={styles.cardTitle}>{item.products.join(' + ')}</Text>
                                </View>
                                <View style={styles.comboPriceRow}>
                                    <View style={styles.priceItem}>
                                        <Text style={styles.priceLabel}>{t('smart.comboOriginal')}</Text>
                                        <Text style={styles.priceOld}>{formatCurrency(item.totalPrice)}</Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
                                    <View style={styles.priceItem}>
                                        <Text style={styles.priceLabel}>{t('smart.comboDiscounted')}</Text>
                                        <Text style={styles.priceNew}>{formatCurrency(item.comboPrice)}</Text>
                                    </View>
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountText}>{item.discount}% {t('smart.comboSave')}</Text>
                                    </View>
                                </View>
                                <Text style={styles.comboMeta}>
                                    {t('smart.comboPurchasedTogether', { count: item.frequency })} • {t('smart.comboSalesBoost', { percent: 15 })}
                                </Text>
                            </View>
                        )) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="pricetags-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyText}>{t('smart.comboEmpty')}</Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'forecast' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('smart.demandForecast')}</Text>
                        <Text style={styles.sectionDesc}>{t('smart.demandDesc')}</Text>
                        {predictions.forecast.length > 0 ? predictions.forecast.map((item, i) => (
                            <View key={i} style={styles.card}>
                                <View style={styles.cardRow}>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{item.productName}</Text>
                                        <View style={styles.forecastMeta}>
                                            <Text style={styles.stockText}>
                                                {t('smart.stock')}: {item.currentStock} | {t('smart.demand')}: {item.predictedDemand}
                                            </Text>
                                        </View>
                                    </View>
                                    {item.needsRestock ? (
                                        <View style={styles.restockBadge}>
                                            <Text style={styles.restockText}>
                                                {t('smart.orderUnits', { count: item.recommendedOrder })}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.okBadge}>
                                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                                        </View>
                                    )}
                                </View>
                                {item.daysUntilStockout > 0 && (
                                    <View style={styles.stockoutBar}>
                                        <View style={[styles.stockoutFill, {
                                            width: `${Math.min((item.daysUntilStockout / 14) * 100, 100)}%`,
                                            backgroundColor: item.daysUntilStockout <= 3 ? COLORS.error : item.daysUntilStockout <= 7 ? COLORS.warning : COLORS.success,
                                        }]} />
                                        <Text style={styles.stockoutText}>
                                            ~{item.daysUntilStockout} {t('smart.days')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="analytics-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyText}>{t('smart.forecastEmpty')}</Text>
                            </View>
                        )}
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.white, ...SHADOWS.sm },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    tabRow: { flexDirection: 'row', padding: SPACING.sm, backgroundColor: COLORS.white, gap: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.background, gap: 4 },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    tabTextActive: { color: COLORS.white, fontWeight: '600' },
    content: { flex: 1 },
    section: { padding: SPACING.md },
    sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.xs },
    sectionDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: SPACING.md },
    card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    rankCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
    rankNum: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMuted },
    cardInfo: { flex: 1, marginLeft: SPACING.sm },
    cardTitle: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
    cardMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, gap: 3 },
    seasonIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    seasonHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
    comboHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
    comboPriceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
    priceItem: {},
    priceLabel: { fontSize: 10, color: COLORS.textMuted },
    priceOld: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, textDecorationLine: 'line-through' },
    priceNew: { fontSize: FONT_SIZES.base, fontWeight: 'bold', color: COLORS.success },
    discountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.success + '15' },
    discountText: { fontSize: 11, fontWeight: '600', color: COLORS.success },
    comboMeta: { fontSize: 11, color: COLORS.textMuted },
    forecastMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 2 },
    stockText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    restockBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.warning + '15' },
    restockText: { fontSize: 11, fontWeight: '600', color: COLORS.warning },
    okBadge: { padding: 4 },
    stockoutBar: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
    stockoutFill: { height: '100%', borderRadius: 4 },
    stockoutText: { position: 'absolute', right: 0, fontSize: 10, color: COLORS.textMuted, paddingRight: 4 },
    emptyCard: { alignItems: 'center', paddingVertical: SPACING['3xl'] },
    emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.sm, textAlign: 'center' },
});
