/**
 * SmartSuggestionsCard - Dashboard card showing AI-powered predictions.
 * All strings use t() for i18n support.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';
import { formatCurrency } from '../../i18n';
import { useInventoryStore, Product, SaleRecord } from '../../store/inventoryStore';
import { useTransactionStore, Transaction } from '../../store/transactionStore';
import { getFullPredictions, FullPredictions } from '../../services/predictionService';
import { useSettingsStore } from '../../store/settingsStore';

interface SmartSuggestionsCardProps {
    onSeeAll: () => void;
}

export const SmartSuggestionsCard: React.FC<SmartSuggestionsCardProps> = ({ onSeeAll }) => {
    const [activeTab, setActiveTab] = useState<'trending' | 'season' | 'combo'>('trending');
    const products = useInventoryStore(s => s.products);
    const salesHistory = useInventoryStore(s => s.salesHistory);
    const transactions = useTransactionStore(s => s.transactions);
    const { showPredictions } = useSettingsStore();

    const predictions = useMemo((): FullPredictions | null => {
        if (!showPredictions) return null;
        return getFullPredictions(products, salesHistory, transactions);
    }, [products, salesHistory, transactions, showPredictions]);

    if (!showPredictions || !predictions) return null;

    const tabs = [
        { key: 'trending' as const, label: t('smart.trending'), icon: 'trending-up' as const },
        { key: 'season' as const, label: t('smart.season'), icon: 'calendar-outline' as const },
        { key: 'combo' as const, label: t('smart.combo'), icon: 'pricetags-outline' as const },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
                    <Text style={styles.headerTitle}>{t('smart.predictions')}</Text>
                </View>
                <TouchableOpacity onPress={onSeeAll}>
                    <Text style={styles.seeAll}>{t('smart.seeAll')} →</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {tabs.map(tab => (
                    <TouchableOpacity key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}>
                        <Ionicons name={tab.icon} size={14}
                            color={activeTab === tab.key ? COLORS.white : COLORS.textMuted} />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'trending' && (
                <View style={styles.tabContent}>
                    {predictions.trending.length > 0 ? predictions.trending.slice(0, 3).map((item, i) => (
                        <View key={i} style={styles.trendItem}>
                            <View style={[styles.rankBadge, i === 0 && { backgroundColor: COLORS.warning + '20' }]}>
                                <Text style={[styles.rankText, i === 0 && { color: COLORS.warning }]}>#{i + 1}</Text>
                            </View>
                            <View style={styles.trendInfo}>
                                <Text style={styles.trendName}>{item.productName}</Text>
                                <Text style={styles.trendMeta}>{item.avgDailySales.toFixed(1)}{t('smart.perDay')}</Text>
                            </View>
                            <View style={[styles.trendBadge, { backgroundColor: item.trend === 'rising' ? COLORS.success + '15' : COLORS.error + '15' }]}>
                                <Ionicons name={item.trend === 'rising' ? 'arrow-up' : 'arrow-down'} size={12}
                                    color={item.trend === 'rising' ? COLORS.success : COLORS.error} />
                                <Text style={{ fontSize: 11, color: item.trend === 'rising' ? COLORS.success : COLORS.error }}>
                                    {item.trendPercent > 0 ? '+' : ''}{item.trendPercent.toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    )) : <Text style={styles.emptyText}>{t('smart.trendingEmpty')}</Text>}
                </View>
            )}

            {activeTab === 'season' && (
                <View style={styles.tabContent}>
                    {predictions.seasonal.length > 0 ? predictions.seasonal.slice(0, 2).map((item, i) => (
                        <View key={i} style={styles.seasonItem}>
                            <View style={styles.seasonIcon}>
                                <Ionicons name="calendar" size={18} color={COLORS.primary} />
                            </View>
                            <View style={styles.seasonInfo}>
                                <Text style={styles.seasonName}>{item.season}</Text>
                                <Text style={styles.seasonProducts}>
                                    {item.products.slice(0, 3).join(', ')}
                                </Text>
                            </View>
                            <View style={[styles.seasonBadge, { backgroundColor: item.isActive ? COLORS.success + '15' : COLORS.warning + '15' }]}>
                                <Text style={{ fontSize: 10, color: item.isActive ? COLORS.success : COLORS.warning, fontWeight: '600' }}>
                                    {item.isActive ? t('smart.seasonActive') : t('smart.seasonUpcoming')}
                                </Text>
                            </View>
                        </View>
                    )) : <Text style={styles.emptyText}>{t('smart.noSeasonalData')}</Text>}
                </View>
            )}

            {activeTab === 'combo' && (
                <View style={styles.tabContent}>
                    {predictions.combos.length > 0 ? predictions.combos.slice(0, 2).map((item, i) => (
                        <View key={i} style={styles.comboItem}>
                            <View style={styles.comboIcon}>
                                <Ionicons name="pricetags" size={16} color={COLORS.accent} />
                            </View>
                            <View style={styles.comboInfo}>
                                <Text style={styles.comboName}>
                                    {item.products.join(' + ')}
                                </Text>
                                <Text style={styles.comboPrice}>
                                    {t('smart.comboOriginal')}{formatCurrency(item.totalPrice)} → {t('smart.comboDiscounted')}{formatCurrency(item.comboPrice)}
                                </Text>
                            </View>
                            <View style={styles.saveBadge}>
                                <Text style={styles.saveText}>{item.discount}% {t('smart.comboSave')}</Text>
                            </View>
                        </View>
                    )) : <Text style={styles.emptyText}>{t('smart.comboEmpty')}</Text>}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, marginHorizontal: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, paddingBottom: 0 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    headerTitle: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.textPrimary },
    seeAll: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '500' },
    tabs: { flexDirection: 'row', padding: SPACING.sm, paddingBottom: 0, gap: SPACING.xs },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.background, gap: 4 },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    tabTextActive: { color: COLORS.white, fontWeight: '600' },
    tabContent: { padding: SPACING.md },
    trendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted },
    trendInfo: { flex: 1, marginLeft: SPACING.sm },
    trendName: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    trendMeta: { fontSize: 11, color: COLORS.textMuted },
    trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, gap: 2 },
    seasonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    seasonIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center' },
    seasonInfo: { flex: 1, marginLeft: SPACING.sm },
    seasonName: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    seasonProducts: { fontSize: 11, color: COLORS.textMuted },
    seasonBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
    comboItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    comboIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.accent + '10', justifyContent: 'center', alignItems: 'center' },
    comboInfo: { flex: 1, marginLeft: SPACING.sm },
    comboName: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    comboPrice: { fontSize: 11, color: COLORS.textMuted },
    saveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.success + '15' },
    saveText: { fontSize: 10, color: COLORS.success, fontWeight: '600' },
    emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.lg },
});
