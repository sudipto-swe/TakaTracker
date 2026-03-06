/**
 * Add Transaction Screen - Sale, Purchase, or Expense.
 * Sales pick from existing inventory. Purchases add to inventory.
 * Expenses have category selection. Contacts auto-created.
 */
import React, { useState } from 'react'; 
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    FlatList,
    
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTransactionStore, TransactionType, Transaction, ExpenseCategory } from '../../store/transactionStore';
import { useInventoryStore, Product, LowStockWarning } from '../../store/inventoryStore';
import { useContactStore } from '../../store/contactStore';
import { useSyncStore } from '../../store/syncStore';
import { LowStockAlert } from '../../components/LowStockAlert';
import { useLanguage } from '../../i18n/LanguageContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';

const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; icon: string }[] = [
    { key: 'employee', label: 'কর্মচারী বেতন', icon: 'people' },
    { key: 'electricity', label: 'বিদ্যুৎ বিল', icon: 'flash' },
    { key: 'rent', label: 'দোকান ভাড়া', icon: 'home' },
    { key: 'transport', label: 'পরিবহন', icon: 'car' },
    { key: 'others', label: 'অন্যান্য', icon:  'ellipsis-horizontal' },
];

export const AddTransactionScreen: React.FC = () => {
    const navigation = useNavigation();
    const { language } = useLanguage();
    const { addTransaction } = useTransactionStore();
    const { products, sellProduct, purchaseProduct } = useInventoryStore();
    const { getOrCreateContact } = useContactStore();
    const { addToQueue, isOnline } = useSyncStore();

    const [transactionType, setTransactionType] = useState<TransactionType>('sale');
    const [amount, setAmount] = useState('');
    const [paidAmountStr, setPaidAmountStr] = useState('');
    const [contactName, setContactName] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product picker state (for sales)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('' );

    // Purchase fields
    const [purchaseProductName, setPurchaseProductName] = useState('');
    const [purchaseQty, setPurchaseQty] = useState('');
    const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('');
    const [purchaseSellPrice, setPurchaseSellPrice] = useState('');
    const [purchaseUnit, setPurchaseUnit] = useState('পিস');
    const [purchaseCategory, setPurchaseCategory] = useState('');

    // Expense fields
    const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('others');

    // Low stock alert
    const [lowStockWarning, setLowStockWarning] = useState<LowStockWarning | null>(null);

    const TRANSACTION_TYPES = [
        { key: 'sale' as TransactionType, label: t('transactions.sale'), icon: 'arrow-up-circle', color: COLORS.success },
        { key: 'purchase' as TransactionType, label: t('transactions.purchase'), icon: 'arrow-down-circle', color: COLORS.error },
        { key: 'expense' as TransactionType, label: t('transactions.expense'), icon: 'trending-down', color: COLORS.warning },
     ];

    const isSale = transactionType === 'sale';
    const isPurchase = transactionType === 'purchase';
    const isExpense = transactionType === 'expense';
    const hasDueSupport = isSale || isPurchase;

    // Sale: auto-compute from product
    const parsedQty = parseInt(quantity) || 0;
    const autoSaleAmount = isSale && selectedProduct ? selectedProduct.sellingPrice * parsedQty : 0;

    // Purchase: compute from qty × price
    const parsedPurchaseQty = parseInt(purchaseQty) || 0;
    const parsedPurchasePrice = parseFloat(purchaseUnitPrice) || 0;
    const autoPurchaseAmount = parsedPurchaseQty * parsedPurchasePrice;

    // Final amount
    const parsedAmount = isSale && selectedProduct
        ? autoSaleAmount
        : isPurchase
            ? autoPurchaseAmount
            : (parseFloat(amount) || 0);

    const parsedPaid = hasDueSupport && paidAmountStr !== '' ? parseFloat(paidAmountStr) || 0 : parsedAmount;
    const dueAmount = Math.max(0, parsedAmount - parsedPaid);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.stock > 0
    );

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setQuantity('1');
        setShowProductPicker(false);
        setProductSearch('');
      };

    const handleSubmit = async () => {
        // Validate
        if (isSale && selectedProduct) {
            if (parsedQty <= 0) {
                Alert.alert(t('common.error'), t('transactions.errorCorrectAmount'));
                return;
            }
            if (parsedQty > selectedProduct.stock) {
                Alert.alert(t('common.error'), `স্টকে মাত্র ${selectedProduct.stock} ${selectedProduct.unit} আছে`);
                return;
            }
        } else if (isPurchase) {
            if (!purchaseProductName.trim()) {
                Alert.alert(t('common.error'), 'পণ্যের নাম দিন');
                return;
            }
            if (parsedPurchaseQty <= 0 || parsedPurchasePrice <= 0) {
                Alert.alert(t('common.error'), 'সঠিক পরিমাণ ও দাম দিন');
                return;
            }
        } else if (isExpense && parsedAmount <= 0) {
            Alert.alert(t('common.error'), t('transactions.errorCorrectAmount'));
            return;
        } else if (isSale && !selectedProduct) {
            Alert.alert(t('common.error'), 'পণ্য নির্বাচন করুন');
            return;
        }

        if (hasDueSupport && parsedPaid > parsedAmount) {
            Alert.alert(t('common.error'), t('transactions.errorPaidExceeds'));
            return;
          }

        setIsSubmitting(true);

        try {
            const localId = `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const finalAmount = parsedAmount;
            const finalPaid = hasDueSupport ? parsedPaid : finalAmount;
            const finalDue = hasDueSupport ? Math.max(0, finalAmount - finalPaid) : 0;

            let txProductId: string | undefined;
            let txProductName: string | undefined;
            let txQuantity: number | undefined;
            let txUnitBuyPrice: number | undefined;
            let txUnitSellPrice: number | undefined;
            let txUnit: string | undefined;
            let txContactId: string | undefined;

            if (isSale && selectedProduct) {
                const result = sellProduct(selectedProduct.id, parsedQty, selectedProduct.sellingPrice);
                if (!result.success) {
                    Alert.alert(t('common.error'), result.message);
                    setIsSubmitting(false);
                    return;
                }
                // Check for low stock warning
                if (result.lowStockWarning) {
                    setLowStockWarning(result.lowStockWarning);
                }
                txProductId = selectedProduct.id;
                txProductName = selectedProduct.name;
                txQuantity = parsedQty;
                txUnitBuyPrice = selectedProduct.purchasePrice;
                txUnitSellPrice = selectedProduct.sellingPrice;
                txUnit = selectedProduct.unit;
            }

            if (isPurchase) {
                const product = purchaseProduct(
                    purchaseProductName.trim(),
                    parsedPurchaseQty,
                    parsedPurchasePrice,
                    parseFloat(purchaseSellPrice) || 0,
                    purchaseUnit,
                    purchaseCategory || 'অন্যান্য'
                );
                txProductId = product.id;
                txProductName = product.name;
                txQuantity = parsedPurchaseQty;
                txUnitBuyPrice = parsedPurchasePrice;
                txUnit = purchaseUnit;
            }

            // Auto-create contact
            if (contactName.trim()) {
                const contactType = isSale ? 'customer' : 'supplier';
                if (isSale || isPurchase) {
                    const contact = getOrCreateContact(contactName.trim(), contactType as any);
                    txContactId = contact.id;
                }
            }

            const transaction: Transaction = {
                id: localId,
                localId,
                type: transactionType,
                referenceNumber: `${transactionType.toUpperCase().slice(0, 3)}-${Date.now() % 1000000}`,
                contactId: txContactId,
                contactName: contactName.trim() || undefined,
                productId: txProductId,
                productName: txProductName,
                quantity: txQuantity,
                unitBuyPrice: txUnitBuyPrice,
                unitSellPrice: txUnitSellPrice,
                unit: txUnit,
                expenseCategory: isExpense ? expenseCategory : undefined,
                amount: finalAmount,
                paidAmount: finalPaid,
                dueAmount: finalDue,
                discount: 0,
                notes: notes || undefined,
                paymentMethod: 'cash',
                date: new Date(),
                isSynced: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await addTransaction(transaction);

            if (!isOnline) {
                addToQueue({ type: 'transaction', action: 'create', data: transaction });
            }

            let successMsg = '';
            if (isSale && selectedProduct) {
                successMsg = `${selectedProduct.name} ${parsedQty} ${selectedProduct.unit} বিক্রয় হয়েছে\nমোট: ${formatCurrency(finalAmount)}`;
            } else if (isPurchase) {
                successMsg = `${purchaseProductName.trim()} ${parsedPurchaseQty} ${purchaseUnit} ক্রয় হয়েছে\nমোট: ${formatCurrency(finalAmount)}`;
            } else {
                successMsg = `খরচ সংরক্ষিত হয়েছে: ${formatCurrency(finalAmount)}`;
            }

            if (finalDue > 0) {
                successMsg += `\nবাকি: ${formatCurrency(finalDue)}`;
            }

            Alert.alert(` ${t('common.success')}!`, successMsg, [
                {
                    text: 'OK',
                    onPress: () => {
                        if (!lowStockWarning) {
                            navigation.goBack();
                        }
                        // If low stock warning exists, delay navigation to show popup
                    },
                },
            ]);

            if (lowStockWarning) {
                // Navigate back after 3 seconds to let user see the alert
                setTimeout(() => navigation.goBack(), 3500);
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            Alert.alert(t('common.error'), t('transactions.errorSaving'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = () => {
        if (isSale) return !!selectedProduct && parsedQty > 0;
        if (isPurchase) return !!purchaseProductName.trim() && parsedPurchaseQty > 0 && parsedPurchasePrice > 0;
        if (isExpense) return parsedAmount > 0;
        return false;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Low Stock Alert Popup */}
            <LowStockAlert
                warning={lowStockWarning}
                onDismiss={() => setLowStockWarning(null)}
            />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('transactions.addTransaction')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Transaction Type Selection */}
                    <Text style={styles.sectionTitle}>{t('transactions.transactionType')}</Text>
                    <View style={styles.typeGrid}>
                        {TRANSACTION_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.key}
                                style={[
                                    styles.typeButton,
                                    transactionType === type.key && { borderColor: type.color, borderWidth: 2 },
                                ]}
                                onPress={() => {
                                    setTransactionType(type.key);
                                    setSelectedProduct(null);
                                    setQuantity('');
                                    setAmount('');
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                                    <Ionicons name={type.icon as any} size={24} color={type.color} />
                                </View>
                                <Text style={[
                                    styles.typeLabel,
                                    transactionType === type.key && { color: type.color, fontWeight: '600' }
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ===== SALE FIELDS ===== */}
                    {isSale && (
                        <>
                            <Text style={styles.sectionTitle}>{t('transactions.selectProduct')}</Text>
                            <TouchableOpacity
                                style={styles.productPickerBtn}
                                onPress={() => setShowProductPicker(true)}
                            >
                                <Ionicons name="cube-outline" size={22} color={selectedProduct ? COLORS.primary : COLORS.gray400} />
                                <Text style={[
                                    styles.productPickerText,
                                    selectedProduct && { color: COLORS.textPrimary, fontWeight: '600' }
                                ]}>
                                    {selectedProduct
                                        ? `${selectedProduct.name} (${formatCurrency(selectedProduct.sellingPrice)}/${selectedProduct.unit})`
                                        : t('transactions.chooseProduct')}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                            </TouchableOpacity>

                            {selectedProduct && (
                                <>
                                    <Text style={styles.sectionTitle}>{t('transactions.quantity')} ({selectedProduct.unit})</Text>
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => setQuantity(String(Math.max(1, parsedQty - 1)))}
                                        >
                                            <Ionicons name="remove" size={22} color={COLORS.white} />
                                        </TouchableOpacity>
                                        <TextInput
                                            style={styles.qtyInput}
                                            value={quantity}
                                            onChangeText={setQuantity}
                                            keyboardType="numeric"
                                            textAlign="center"
                                        />
                                        <TouchableOpacity
                                            style={[styles.qtyBtn, { backgroundColor: COLORS.success }]}
                                            onPress={() => setQuantity(String(parsedQty + 1))}
                                        >
                                            <Ionicons name="add" size={22} color={COLORS.white} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.stockHint}>
                                        স্টক: {selectedProduct.stock} {selectedProduct.unit}
                                    </Text>

                                    <View style={styles.autoAmountCard}>
                                        <Text style={styles.autoAmountLabel}>মোট মূল্য</Text>
                                        <Text style={styles.autoAmountValue}>{formatCurrency(autoSaleAmount)}</Text>
                                        <Text style={styles.autoAmountBreakdown}>
                                            {formatCurrency(selectedProduct.sellingPrice)} × {parsedQty} {selectedProduct.unit}
                                        </Text>
                                        <Text style={[styles.autoAmountBreakdown, { color: COLORS.success }]}>
                                            লাভ: {formatCurrency((selectedProduct.sellingPrice - selectedProduct.purchasePrice) * parsedQty)}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </>
                    )}

                    {/* PURCHASE FIELDS */}
                    {isPurchase && (
                        <>
                            <Text style={styles.sectionTitle}>পণ্যের নাম</Text>
                            <TextInput
                                style={styles.textInputField}
                                value={purchaseProductName}
                                onChangeText={setPurchaseProductName}
                                placeholder="যেমন: চাল, তেল, সাবান"
                                placeholderTextColor={COLORS.gray400}
                            />

                            <View style={styles.rowFields}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>পরিমাণ</Text>
                                    <TextInput
                                        style={styles.textInputField}
                                        value={purchaseQty}
                                        onChangeText={setPurchaseQty}
                                        placeholder="0"
                                        placeholderTextColor={COLORS.gray400}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ width: SPACING.sm }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>একক</Text>
                                    <TextInput
                                        style={styles.textInputField}
                                        value={purchaseUnit}
                                        onChangeText={setPurchaseUnit}
                                        placeholder="কেজি/লিটার/পিস"
                                        placeholderTextColor={COLORS.gray400}
                                    />
                                </View>
                            </View>

                            <View style={styles.rowFields}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>ক্রয় মূল্য (প্রতি একক)</Text>
                                    <TextInput
                                        style={styles.textInputField}
                                        value={purchaseUnitPrice}
                                        onChangeText={setPurchaseUnitPrice}
                                        placeholder="৳ 0"
                                        placeholderTextColor={COLORS.gray400}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ width: SPACING.sm }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>বিক্রয় মূল্য (প্রতি একক)</Text>
                                    <TextInput
                                        style={styles.textInputField}
                                        value={purchaseSellPrice}
                                        onChangeText={setPurchaseSellPrice}
                                        placeholder="৳ 0"
                                        placeholderTextColor={COLORS.gray400}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <TextInput
                                style={styles.textInputField}
                                value={purchaseCategory}
                                onChangeText={setPurchaseCategory}
                                placeholder="ক্যাটাগরি (যেমন: খাদ্য, প্রসাধন)"
                                placeholderTextColor={COLORS.gray400}
                            />

                            {autoPurchaseAmount > 0 && (
                                <View style={[styles.autoAmountCard, { borderColor: COLORS.error + '30' }]}>
                                    <Text style={[styles.autoAmountLabel, { color: COLORS.error }]}>মোট ক্রয় মূল্য</Text>
                                    <Text style={[styles.autoAmountValue, { color: COLORS.error }]}>{formatCurrency(autoPurchaseAmount)}</Text>
                                    <Text style={styles.autoAmountBreakdown}>
                                        {formatCurrency(parsedPurchasePrice)} × {parsedPurchaseQty} {purchaseUnit}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    /* ===== EXPENSE FIELDS ===== */
                    {isExpense && (
                        <>
                            <Text style={styles.sectionTitle}>খরচের ধরন</Text>
                            <View style={styles.expenseCategoryGrid}>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[
                                            styles.expenseCategoryBtn,
                                            expenseCategory === cat.key && { borderColor: COLORS.warning, borderWidth: 2 },
                                        ]}
                                        onPress={() => setExpenseCategory(cat.key)}
                                    >
                                        <Ionicons name={cat.icon as any} size={20} color={expenseCategory === cat.key ? COLORS.warning : COLORS.gray500} />
                                        <Text style={[
                                            styles.expenseCategoryLabel,
                                            expenseCategory === cat.key && { color: COLORS.warning, fontWeight: '600' }
                                        ]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.sectionTitle}>{t('transactions.amount')}</Text>
                            <View style={styles.amountContainer}>
                                <Text style={styles.currencySymbol}>৳</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.gray300}
                                    keyboardType="numeric"
                                    autoFocus
                                />
                            </View>
                        </>
                    )}

                    {/* Paid Amount (sale & purchase) */}
                    {hasDueSupport && parsedAmount > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>{t('transactions.paidAmountLabel')}</Text>
                            <View style={styles.amountContainer}>
                                <Text style={[styles.currencySymbol, { fontSize: FONT_SIZES.xl }]}>৳</Text>
                                <TextInput
                                    style={[styles.amountInput, { fontSize: FONT_SIZES.xl }]}
                                    value={paidAmountStr}
                                    onChangeText={setPaidAmountStr}
                                    placeholder={parsedAmount.toString()}
                                    placeholderTextColor={COLORS.gray300}
                                    keyboardType="numeric"
                                />
                            </View>
                            {dueAmount > 0 && (
                                <View style={styles.dueInfoRow}>
                                    <Ionicons
                                        name={isSale ? 'arrow-down-circle' : 'arrow-up-circle'}
                                        size={20}
                                        color={isSale ? COLORS.success : COLORS.error}
                                    />
                                    <Text style={[
                                        styles.dueInfoText,
                                        { color: isSale ? COLORS.success : COLORS.error }
                                    ]}>
                                        {isSale ? 'পাওনা' : 'দেনা'}: ৳{dueAmount}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    {/* Contact (sale & purchase) */}
                    {(isSale || isPurchase) && (
                        <>
                            <Text style={styles.sectionTitle}>{isSale ? 'গ্রাহকের নাম' : 'সরবরাহকারীর নাম'}</Text>
                            <View style={styles.contactPicker}>
                                <Ionicons name="person-outline" size={20} color={COLORS.gray400} />
                                <TextInput
                                    style={styles.contactInput}
                                    value={contactName}
                                    onChangeText={setContactName}
                                    placeholder={isSale ? 'গ্রাহকের নাম (ঐচ্ছিক)' : 'সরবরাহকারীর নাম (ঐচ্ছিক)'}
                                    placeholderTextColor={COLORS.gray400}
                                />
                            </View>
                        </>
                    )}

                    {/* Notes */}
                    <Text style={styles.sectionTitle}>{t('transactions.notes')}</Text>
                    <TextInput
                        style={styles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={t('transactions.notesPlaceholder')}
                        placeholderTextColor={COLORS.gray400}
                        multiline
                        numberOfLines={3}
                    />
                </ScrollView>

                {/* Submit */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!canSubmit() || isSubmitting) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || !canSubmit()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? t('common.saving') : t('common.save')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Product Picker Modal (Sale) */}
            <Modal visible={showProductPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('transactions.chooseProduct')}</Text>
                            <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalSearchRow}>
                            <Ionicons name="search" size={18} color={COLORS.gray400} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder={t('inventory.searchProducts')}
                                placeholderTextColor={COLORS.gray400}
                                value={productSearch}
                                onChangeText={setProductSearch}
                                autoFocus
                            />
                        </View>
                        <FlatList
                            data={filteredProducts}
                            keyExtractor={item => item.id}
                            style={{ maxHeight: 350 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.productItem}
                                    onPress={() => handleSelectProduct(item)}
                                >
                                    <View style={styles.productItemLeft}>
                                        <Text style={styles.productItemName}>{item.name}</Text>
                                        <Text style={styles.productItemSub}>
                                            স্টক: {item.stock} {item.unit} • {item.category}
                                        </Text>
                                    </View>
                                    <Text style={styles.productItemPrice}>
                                        {formatCurrency(item.sellingPrice)}/{item.unit}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.textMuted }}>
                                        {products.length === 0
                                            ? 'কোনো পণ্য নেই। আগে ক্রয় (Purchase) করুন।'
                                            : t('inventory.noProducts')}
                                    </Text>
                                </View>
                            }
                        />
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
    content: { flex: 1, padding: SPACING.lg },
    sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
    typeGrid: { flexDirection: 'row', gap: SPACING.sm },
    typeButton: {
        flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200,
        backgroundColor: COLORS.white,
    },
    typeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    typeLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
    productPickerBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200, gap: SPACING.sm,
    },
    productPickerText: { flex: 1, fontSize: FONT_SIZES.base, color: COLORS.gray400 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    qtyBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.error,
        justifyContent: 'center', alignItems: 'center',
    },
    qtyInput: {
        flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md, fontSize: FONT_SIZES['2xl'], fontWeight: 'bold',
        color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.gray200,
    },
    stockHint: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs, textAlign: 'center' },
    autoAmountCard: {
        backgroundColor: COLORS.success + '10', borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md, marginTop: SPACING.md, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.success + '30',
    },
    autoAmountLabel: { fontSize: FONT_SIZES.sm, color: COLORS.success },
    autoAmountValue: { fontSize: FONT_SIZES['2xl'], fontWeight: 'bold', color: COLORS.success },
    autoAmountBreakdown: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    textInputField: {
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
        borderWidth: 1, borderColor: COLORS.gray200,
        fontSize: FONT_SIZES.base, color: COLORS.textPrimary, marginBottom: SPACING.sm,
    },
    rowFields: { flexDirection: 'row' },
    expenseCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    expenseCategoryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.gray200,
        backgroundColor: COLORS.white,
    },
    expenseCategoryLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
    amountContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg,
        borderWidth: 1, borderColor: COLORS.gray200,
    },
    currencySymbol: { fontSize: FONT_SIZES['3xl'], fontWeight: 'bold', color: COLORS.primary },
    amountInput: { flex: 1, fontSize: FONT_SIZES['3xl'], fontWeight: 'bold', color: COLORS.textPrimary, paddingVertical: SPACING.md, marginLeft: SPACING.sm },
    dueInfoRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm,
        borderWidth: 1, borderColor: COLORS.gray200, gap: SPACING.sm,
    },
    dueInfoText: { fontSize: FONT_SIZES.base, fontWeight: '600' },
    contactPicker: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200,
    },
    contactInput: { flex: 1, marginHorizontal: SPACING.sm, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
    notesInput: {
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
        borderWidth: 1, borderColor: COLORS.gray200, fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 80,
    },
    footer: { padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
    submitButton: {
        backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md, alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING['3xl'],
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    modalSearchRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, gap: SPACING.sm,
    },
    modalSearchInput: { flex: 1, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
    productItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    productItemLeft: { flex: 1 },
    productItemName: { fontSize: FONT_SIZES.base, fontWeight: '500', color: COLORS.textPrimary },
    productItemSub: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    productItemPrice: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.primary },
});
