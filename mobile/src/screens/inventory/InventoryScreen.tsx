/**
 * Inventory/Products Screen - Read-only stock list (updated from sale/purchase).
 * Owner can edit selling price per product. No manual add or stock-in.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useInventoryStore, Product } from '../../store/inventoryStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';

export const InventoryScreen: React.FC = () => {
    const navigation = useNavigation();
    const { language } = useLanguage();
    const { products, updateSellingPrice, setLowStockThreshold } = useInventoryStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    // Edit selling price modal
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [newPrice, setNewPrice] = useState('');

    // Low stock threshold modal
    const [showThresholdModal, setShowThresholdModal] = useState(false);
    const [thresholdProduct, setThresholdProduct] = useState<Product | null>(null);
    const [newThreshold, setNewThreshold] = useState('');

    const getStockStatus = (stock: number, lowStock: number) => {
        if (stock === 0) return { label: t('inventory.outOfStock'), color: COLORS.error };
        if (stock <= lowStock) return { label: t('inventory.lowStock'), color: COLORS.warning };
        return { label: t('inventory.inStock'), color: COLORS.success };
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeFilter === 'all') return matchesSearch;
        if (activeFilter === 'low') return matchesSearch && product.stock <= product.lowStock && product.stock > 0;
        if (activeFilter === 'out') return matchesSearch && product.stock === 0;
        return matchesSearch;
    });

    const lowStockCount = products.filter(p => p.stock <= p.lowStock && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((s, p) => s + p.sellingPrice * p.stock, 0);
    const totalCost = products.reduce((s, p) => s + p.purchasePrice * p.stock, 0);
    const potentialProfit = totalValue - totalCost;

    const handleEditPrice = (product: Product) => {
        setSelectedProduct(product);
        setNewPrice(product.sellingPrice.toString());
        setShowPriceModal(true);
    };

    const handleSavePrice = () => {
        const price = parseFloat(newPrice);
        if (!price || price <= 0) {
            Alert.alert(t('common.error'), 'সঠিক মূল্য দিন');
            return;
        }
        if (selectedProduct) {
            updateSellingPrice(selectedProduct.id, price);
            Alert.alert('✅', `${selectedProduct.name} বিক্রয় মূল্য আপডেট হয়েছে: ${formatCurrency(price)}`);
        }
        setShowPriceModal(false);
    };

    const handleEditThreshold = (product: Product) => {
        setThresholdProduct(product);
        setNewThreshold(product.lowStock.toString());
        setShowThresholdModal(true);
    };

    const handleSaveThreshold = () => {
        const threshold = parseInt(newThreshold);
        if (isNaN(threshold) || threshold < 0) {
            Alert.alert(t('common.error'), 'সঠিক সংখ্যা দিন');
            return;
        }
        if (thresholdProduct) {
            setLowStockThreshold(thresholdProduct.id, threshold);
            Alert.alert('🔔', `${thresholdProduct.name} — স্টক ${threshold} ${thresholdProduct.unit} এর নিচে গেলে সতর্কতা দেখাবে`);
        }
        setShowThresholdModal(false);
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const status = getStockStatus(item.stock, item.lowStock);
        const profitPerUnit = item.sellingPrice - item.purchasePrice;
        const profitMargin = item.sellingPrice > 0
            ? Math.round((profitPerUnit / item.sellingPrice) * 100)
            : 0;

        return (
            <View style={styles.productCard}>
                <View style={styles.productMain}>
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productSku}>{item.category} • {item.unit}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.priceEditBtn}
                        onPress={() => handleEditPrice(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sellingPrice}>{formatCurrency(item.sellingPrice)}/{item.unit}</Text>
                        <Ionicons name="pencil" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Purchase price & profit */}
                <View style={styles.priceRow}>
                    <Text style={styles.purchasePriceText}>
                        ক্রয়: {formatCurrency(item.purchasePrice)}/{item.unit}
                    </Text>
                    <Text style={[styles.profitText, { color: profitPerUnit >= 0 ? COLORS.success : COLORS.error }]}>
                        লাভ: {formatCurrency(profitPerUnit)}/{item.unit} ({profitMargin}%)
                    </Text>
                </View>

                {/* Sales Stats */}
                <View style={styles.salesStatsRow}>
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatLabel}>{t('inventory.sold')}</Text>
                        <Text style={styles.miniStatValue}>{item.totalSold} {item.unit}</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatLabel}>{t('inventory.revenue')}</Text>
                        <Text style={[styles.miniStatValue, { color: COLORS.success }]}>{formatCurrency(item.totalRevenue)}</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatLabel}>{t('inventory.profit')}</Text>
                        <Text style={[styles.miniStatValue, { color: COLORS.primary }]}>{formatCurrency(item.totalProfit)}</Text>
                    </View>
                </View>

                {/* Stock status + threshold */}
                <View style={styles.stockRow}>
                    <View style={styles.stockLeft}>
                        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                        </View>
                        <Text style={styles.stockCountInline}>{item.stock} {item.unit}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.thresholdBtn}
                        onPress={() => handleEditThreshold(item)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications-outline" size={16} color={COLORS.warning} />
                        <Text style={styles.thresholdText}>সীমা: {item.lowStock}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header - NO add button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('inventory.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Stock Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{products.length}</Text>
                    <Text style={styles.summaryLabel}>{t('inventory.totalProducts')}</Text>
                </View>
                <View style={[styles.summaryItem, styles.middleSummary]}>
                    <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{lowStockCount}</Text>
                    <Text style={styles.summaryLabel}>{t('inventory.lowStock')}</Text>
                </View>
                <View style={[styles.summaryItem, styles.middleSummary]}>
                    <Text style={[styles.summaryValue, { color: COLORS.error }]}>{outOfStockCount}</Text>
                    <Text style={styles.summaryLabel}>{t('inventory.outOfStock')}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: COLORS.primary, fontSize: FONT_SIZES.md }]}>{formatCurrency(totalValue)}</Text>
                    <Text style={styles.summaryLabel}>{t('inventory.totalValue')}</Text>
                </View>
            </View>

            {/* Profit info */}
            <View style={styles.profitBanner}>
                <Ionicons name="trending-up" size={16} color={potentialProfit >= 0 ? COLORS.success : COLORS.error} />
                <Text style={styles.profitBannerText}>
                    সম্ভাব্য লাভ: {formatCurrency(potentialProfit)} (সব স্টক বিক্রি হলে)
                </Text>
            </View>

            {/* Info banner */}
            <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                <Text style={styles.infoBannerText}>
                    পণ্য ক্রয় ও বিক্রয় থেকে স্বয়ংক্রিয়ভাবে আপডেট হয়। বিক্রয় মূল্য পরিবর্তন করতে পণ্যের মূল্যে ট্যাপ করুন।
                </Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray400} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('inventory.searchProducts')}
                    placeholderTextColor={COLORS.gray400}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {[
                    { key: 'all', label: t('inventory.filterAll', { count: products.length }) },
                    { key: 'low', label: t('inventory.filterLow', { count: lowStockCount }) },
                    { key: 'out', label: t('inventory.filterOut', { count: outOfStockCount }) },
                ].map(filter => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
                        onPress={() => setActiveFilter(filter.key)}
                    >
                        <Text style={[styles.filterTabText, activeFilter === filter.key && styles.filterTabTextActive]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Products List */}
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={renderProduct}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={64} color={COLORS.gray300} />
                        <Text style={styles.emptyText}>
                            {products.length === 0
                                ? 'পণ্য ক্রয় (Purchase) করলে এখানে দেখা যাবে'
                                : t('inventory.noProducts')}
                        </Text>
                    </View>
                }
            />

            {/* Edit Selling Price Modal */}
            <Modal visible={showPriceModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.priceModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>বিক্রয় মূল্য পরিবর্তন</Text>
                            <TouchableOpacity onPress={() => setShowPriceModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        {selectedProduct && (
                            <>
                                <Text style={styles.priceModalProduct}>{selectedProduct.name}</Text>
                                <Text style={styles.priceModalCurrent}>
                                    বর্তমান ক্রয় মূল্য: {formatCurrency(selectedProduct.purchasePrice)}/{selectedProduct.unit}
                                </Text>
                                <Text style={styles.sectionLabel}>নতুন বিক্রয় মূল্য (প্রতি {selectedProduct.unit})</Text>
                                <View style={styles.priceInputRow}>
                                    <Text style={styles.priceCurrency}>৳</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={newPrice}
                                        onChangeText={setNewPrice}
                                        keyboardType="numeric"
                                        autoFocus
                                    />
                                </View>
                                {parseFloat(newPrice) > 0 && (
                                    <Text style={[
                                        styles.pricePreview,
                                        { color: (parseFloat(newPrice) - selectedProduct.purchasePrice) >= 0 ? COLORS.success : COLORS.error }
                                    ]}>
                                        লাভ: {formatCurrency(parseFloat(newPrice) - selectedProduct.purchasePrice)}/{selectedProduct.unit}
                                    </Text>
                                )}
                                <TouchableOpacity style={styles.priceSaveBtn} onPress={handleSavePrice}>
                                    <Text style={styles.priceSaveBtnText}>সংরক্ষণ করুন</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Low Stock Threshold Modal */}
            <Modal visible={showThresholdModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.priceModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🔔 স্টক সতর্কতা সীমা</Text>
                            <TouchableOpacity onPress={() => setShowThresholdModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        {thresholdProduct && (
                            <>
                                <Text style={styles.priceModalProduct}>{thresholdProduct.name}</Text>
                                <Text style={styles.priceModalCurrent}>
                                    বর্তমান স্টক: {thresholdProduct.stock} {thresholdProduct.unit}
                                </Text>
                                <Text style={styles.sectionLabel}>
                                    স্টক এই সংখ্যার নিচে গেলে সতর্কতা দেখাবে:
                                </Text>
                                <View style={styles.priceInputRow}>
                                    <Ionicons name="notifications" size={20} color={COLORS.warning} />
                                    <TextInput
                                        style={styles.priceInput}
                                        value={newThreshold}
                                        onChangeText={setNewThreshold}
                                        keyboardType="numeric"
                                        placeholder="সংখ্যা দিন"
                                        autoFocus
                                    />
                                    <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textMuted }}>{thresholdProduct.unit}</Text>
                                </View>
                                <TouchableOpacity style={[styles.priceSaveBtn, { backgroundColor: COLORS.warning }]} onPress={handleSaveThreshold}>
                                    <Text style={styles.priceSaveBtnText}>সীমা সংরক্ষণ করুন</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    title: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    summaryContainer: {
        flexDirection: 'row', backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg, marginTop: SPACING.md,
        borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm,
    },
    summaryItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.xs },
    middleSummary: { borderLeftWidth: 1, borderColor: COLORS.gray200 },
    summaryValue: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    summaryLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
    profitBanner: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '10',
        marginHorizontal: SPACING.lg, marginTop: SPACING.sm, padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, gap: SPACING.xs,
    },
    profitBannerText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.success, fontWeight: '500' },
    infoBanner: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10',
        marginHorizontal: SPACING.lg, marginTop: SPACING.sm, padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, gap: SPACING.xs,
    },
    infoBannerText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.primary },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg, marginTop: SPACING.sm,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200,
    },
    searchInput: { flex: 1, marginLeft: SPACING.sm, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
    filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
    filterTab: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray100,
    },
    filterTabActive: { backgroundColor: COLORS.primary },
    filterTabText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
    filterTabTextActive: { color: COLORS.white, fontWeight: '500' },
    listContent: { padding: SPACING.lg, paddingBottom: 20 },
    productCard: {
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm,
    },
    productMain: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
    productInfo: { flex: 1 },
    productName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
    productSku: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    priceEditBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.primary + '10', paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md,
    },
    sellingPrice: { fontSize: FONT_SIZES.sm, fontWeight: 'bold', color: COLORS.primary },
    priceRow: {
        flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    purchasePriceText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    profitText: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
    salesStatsRow: {
        flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm, marginBottom: SPACING.sm, gap: SPACING.md,
    },
    miniStat: { flex: 1, alignItems: 'center' },
    miniStatLabel: { fontSize: 10, color: COLORS.textMuted },
    miniStatValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary, marginTop: 1 },
    stockRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.gray100,
    },
    stockLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    stockCountInline: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    statusText: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
    emptyState: { alignItems: 'center', paddingTop: SPACING['3xl'] },
    emptyText: {
        fontSize: FONT_SIZES.base, color: COLORS.textMuted, marginTop: SPACING.md,
        textAlign: 'center', paddingHorizontal: SPACING.xl,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    priceModalContent: {
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg, width: '85%', maxWidth: 370,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    priceModalProduct: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
    priceModalCurrent: {
        fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center',
        marginTop: SPACING.xs, marginBottom: SPACING.lg,
    },
    sectionLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
    priceInputRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md,
        borderWidth: 1, borderColor: COLORS.gray200, marginBottom: SPACING.sm,
    },
    priceCurrency: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.primary },
    priceInput: {
        flex: 1, fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary,
        paddingVertical: SPACING.md, marginLeft: SPACING.sm,
    },
    pricePreview: { fontSize: FONT_SIZES.sm, fontWeight: '500', textAlign: 'center', marginBottom: SPACING.md },
    priceSaveBtn: {
        backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md, alignItems: 'center',
    },
    priceSaveBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
    thresholdBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: SPACING.sm, paddingVertical: 4,
        backgroundColor: '#fef3c7', borderRadius: BORDER_RADIUS.full,
    },
    thresholdText: { fontSize: FONT_SIZES.xs, color: '#92400e', fontWeight: '500' },
});
