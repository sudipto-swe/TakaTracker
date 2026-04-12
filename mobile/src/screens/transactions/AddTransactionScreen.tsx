/**
 * Add Transaction Screen - Sale, Purchase, or Expense.
 * Enhanced with: Smart Dropdowns, Barcode Scanner, Voice Input.
 * Sales pick from inventory. Purchases add to inventory.
 * Expenses have category selection. Contacts auto-created.
 */
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, Alert, Modal, FlatList, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTransactionStore, TransactionType, Transaction, ExpenseCategory } from '../../store/transactionStore';
import { useInventoryStore, Product, LowStockWarning } from '../../store/inventoryStore';
import { useContactStore } from '../../store/contactStore';
import { useSyncStore } from '../../store/syncStore';
import { useSettingsStore } from '../../store/settingsStore';
import { LowStockAlert } from '../../components/LowStockAlert';
import { SmartDropdown, DropdownOption } from '../../components/common/SmartDropdown';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';
import { VoiceInputButton } from '../../components/common/VoiceInputButton';
import { VoiceConfirmationModal } from '../../components/common/VoiceConfirmationModal';
import { parseVoiceInput, ExtractedTransactionData } from '../../services/voiceService';
import { useLanguage } from '../../i18n/LanguageContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';

// Dropdown options instantiated dynamically below

const EXPENSE_CATEGORIES: { key: ExpenseCategory; labelKey: string; icon: string }[] = [
    { key: 'employee', labelKey: 'transactions.expenseEmployee', icon: 'people' },
    { key: 'electricity', labelKey: 'transactions.expenseElectricity', icon: 'flash' },
    { key: 'rent', labelKey: 'transactions.expenseRent', icon: 'home' },
    { key: 'transport', labelKey: 'transactions.expenseTransport', icon: 'car' },
    { key: 'others', labelKey: 'transactions.expenseOthers', icon: 'ellipsis-horizontal' },
];

export const AddTransactionScreen: React.FC = () => {
    const navigation = useNavigation();
    const { language } = useLanguage();
    const { addTransaction } = useTransactionStore();
    const { products, sellProduct, purchaseProduct, getProductByName } = useInventoryStore();
    const { contacts, getOrCreateContact, updateBalance } = useContactStore();
    const { addToQueue, isOnline } = useSyncStore();
    const { voiceModeEnabled, recentUnits, recentCategories, recentPaymentMethods,
        addRecentUnit, addRecentCategory, addRecentPaymentMethod } = useSettingsStore();

    const [transactionType, setTransactionType] = useState<TransactionType>('sale');
    const [amount, setAmount] = useState('');
    const [paidAmountStr, setPaidAmountStr] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receiptImage, setReceiptImage] = useState<string | null>(null);

    const UNIT_OPTIONS: DropdownOption[] = useMemo(() => [
        { label: t('inventory.unitPiece', { defaultValue: 'পিস' }), value: 'পিস', icon: 'cube-outline' },
        { label: t('inventory.unitKg', { defaultValue: 'কেজি' }), value: 'কেজি', icon: 'cube-outline' },
        { label: t('inventory.unitLiter', { defaultValue: 'লিটার' }), value: 'লিটার', icon: 'water-outline' },
        { label: t('inventory.unitDozen', { defaultValue: 'ডজন' }), value: 'ডজন', icon: 'grid-outline' },
        { label: t('inventory.unitBag', { defaultValue: 'বস্তা' }), value: 'বস্তা', icon: 'cube-outline' },
    ], [language]);

    const CATEGORY_OPTIONS: DropdownOption[] = useMemo(() => [
        { label: t('categories.food', { defaultValue: 'খাদ্যদ্রব্য' }), value: 'খাদ্যদ্রব্য', icon: 'fast-food-outline' },
        { label: t('categories.grocery', { defaultValue: 'মুদি' }), value: 'মুদি', icon: 'basket-outline' },
        { label: t('categories.electronics', { defaultValue: 'ইলেকট্রনিক্স' }), value: 'ইলেকট্রনিক্স', icon: 'phone-portrait-outline' },
        { label: t('categories.medicine', { defaultValue: 'ঔষধ' }), value: 'ঔষধ', icon: 'medkit-outline' },
        { label: t('categories.others', { defaultValue: 'অন্যান্য' }), value: 'অন্যান্য', icon: 'ellipsis-horizontal' },
    ], [language]);

    const PAYMENT_OPTIONS: DropdownOption[] = useMemo(() => [
        { label: 'নগদ (Cash)', value: 'cash', icon: 'cash-outline', iconColor: COLORS.success },
        { label: 'বিকাশ', value: 'bkash', icon: 'phone-portrait-outline', iconColor: '#E2136E' },
        { label: 'নগদ (Nagad)', value: 'nagad', icon: 'phone-portrait-outline', iconColor: '#F6A623' },
        { label: 'রকেট', value: 'rocket', icon: 'phone-portrait-outline', iconColor: '#8C3494' },
        { label: 'ব্যাংক', value: 'bank', icon: 'business-outline', iconColor: COLORS.primary },
    ], [language]);

    // Product picker state (for sales)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');

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

    // Barcode scanner
    const [showScanner, setShowScanner] = useState(false);

    // Voice confirmation
    const [showVoiceConfirm, setShowVoiceConfirm] = useState(false);
    const [voiceData, setVoiceData] = useState<ExtractedTransactionData | null>(null);

    const TRANSACTION_TYPES = [
        { key: 'sale' as TransactionType, label: t('transactions.sale'), icon: 'arrow-up-circle', color: COLORS.success },
        { key: 'purchase' as TransactionType, label: t('transactions.purchase'), icon: 'arrow-down-circle', color: COLORS.error },
        { key: 'expense' as TransactionType, label: t('transactions.expense'), icon: 'trending-down', color: COLORS.warning },
    ];

    const isSale = transactionType === 'sale';
    const isPurchase = transactionType === 'purchase';
    const isExpense = transactionType === 'expense';
    const hasDueSupport = isSale || isPurchase;

    const parsedQty = parseInt(quantity) || 0;
    const autoSaleAmount = isSale && selectedProduct ? selectedProduct.sellingPrice * parsedQty : 0;
    const parsedPurchaseQty = parseInt(purchaseQty) || 0;
    const parsedPurchasePrice = parseFloat(purchaseUnitPrice) || 0;
    const autoPurchaseAmount = parsedPurchaseQty * parsedPurchasePrice;
    const parsedAmount = isSale && selectedProduct ? autoSaleAmount : isPurchase ? autoPurchaseAmount : (parseFloat(amount) || 0);
    const parsedPaid = hasDueSupport && paidAmountStr !== '' ? parseFloat(paidAmountStr) || 0 : parsedAmount;
    const dueAmount = Math.max(0, parsedAmount - parsedPaid);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.stock > 0
    );

    // Dropdown options from existing data
    const productDropdownOptions: DropdownOption[] = useMemo(() =>
        products.map(p => ({
            label: p.name,
            value: p.name,
            subtitle: `${p.category} • স্টক: ${p.stock} ${p.unit}`,
            icon: 'cube-outline' as any,
        })), [products]);

    const contactDropdownOptions: DropdownOption[] = useMemo(() =>
        contacts
            .filter(c => isSale ? c.type === 'customer' : c.type === 'supplier')
            .map(c => ({
                label: c.name,
                value: c.name,
                subtitle: c.phone || '',
                icon: 'person-outline' as any,
            })), [contacts, isSale]);

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setQuantity('1');
        setShowProductPicker(false);
        setProductSearch('');
    };

    // Barcode scan handler
    const handleBarcodeScanned = (barcode: string, type: string) => {
        setShowScanner(false);
        // Try to find product by SKU/barcode
        const found = products.find(p => p.sku === barcode || p.sku.includes(barcode));
        if (found) {
            if (isSale) {
                setSelectedProduct(found);
                setQuantity('1');
                Alert.alert(t('scanner.productFound'), `${found.name}\n${t('transactions.sellPriceLabel')}: ${formatCurrency(found.sellingPrice)}/${found.unit}\n${t('transactions.stockLabel')}: ${found.stock} ${found.unit}`);
            } else if (isPurchase) {
                setPurchaseProductName(found.name);
                setPurchaseUnit(found.unit);
                setPurchaseCategory(found.category);
                setPurchaseUnitPrice(found.purchasePrice.toString());
                setPurchaseSellPrice(found.sellingPrice.toString());
                Alert.alert(t('scanner.productFound'), `${found.name} — ${t('scanner.productAutoFilled')}`);
            }
        } else {
            if (isPurchase) {
                Alert.alert('🆕 নতুন পণ্য', `বারকোড: ${barcode}\nনতুন পণ্য হিসেবে যোগ হবে।`);
            } else {
                Alert.alert(t('scanner.productNotFound'), t('scanner.notInInventory', { code: barcode }));
            }
        }
    };

    // Voice input handler
    const handleVoiceText = (text: string) => {
        const productData = products.map(p => ({ name: p.name, id: p.id, sellingPrice: p.sellingPrice, unit: p.unit, category: p.category }));
        const contactData = contacts.map(c => ({ name: c.name, phone: c.phone }));
        const extracted = parseVoiceInput(text, productData, contactData);
        setVoiceData(extracted);
        setShowVoiceConfirm(true);
    };

    // Voice confirmation handler
    const handleVoiceConfirm = (data: ExtractedTransactionData) => {
        setShowVoiceConfirm(false);
        if (data.type) setTransactionType(data.type);
        if (data.productName) {
            const found = products.find(p => p.name === data.productName);
            if (found && (data.type === 'sale' || !data.type)) {
                setSelectedProduct(found);
                setQuantity(String(data.quantity || 1));
            } else if (data.type === 'purchase') {
                setPurchaseProductName(data.productName);
                if (data.quantity) setPurchaseQty(String(data.quantity));
                if (data.price) setPurchaseUnitPrice(String(data.price));
                if (data.unit) setPurchaseUnit(data.unit);
            }
        }
        if (data.totalAmount && data.type === 'expense') setAmount(String(data.totalAmount));
        if (data.customerName) setContactName(data.customerName);
        if (data.customerPhone) setContactPhone(data.customerPhone);
        if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
    };

    const handleSubmit = async () => {
        if (isSale && selectedProduct) {
            if (parsedQty <= 0) { Alert.alert(t('common.error'), t('transactions.errorCorrectAmount')); return; }
            if (parsedQty > selectedProduct.stock) { Alert.alert(t('common.error'), t('transactions.errorStockInsufficient', { count: selectedProduct.stock, unit: selectedProduct.unit })); return; }
        } else if (isPurchase) {
            if (!purchaseProductName.trim()) { Alert.alert(t('common.error'), t('transactions.productNameLabel')); return; }
            if (parsedPurchaseQty <= 0 || parsedPurchasePrice <= 0) { Alert.alert(t('common.error'), t('transactions.errorCorrectAmount')); return; }
        } else if (isExpense && parsedAmount <= 0) { Alert.alert(t('common.error'), t('transactions.errorCorrectAmount')); return; }
        else if (isSale && !selectedProduct) { Alert.alert(t('common.error'), t('transactions.selectProductFirst')); return; }

        if ((isSale || isPurchase) && contactName.trim()) {
            if (!contactPhone.trim()) { Alert.alert(t('common.error'), t('transactions.phoneRequired')); return; }
            if (!/^01[0-9]{9}$/.test(contactPhone.trim())) { Alert.alert(t('common.error'), t('transactions.phoneInvalid')); return; }
        }
        if (hasDueSupport && parsedPaid > parsedAmount) { Alert.alert(t('common.error'), t('transactions.errorPaidExceeds')); return; }

        setIsSubmitting(true);
        try {
            const localId = `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const finalAmount = parsedAmount;
            const finalPaid = hasDueSupport ? parsedPaid : finalAmount;
            const finalDue = hasDueSupport ? Math.max(0, finalAmount - finalPaid) : 0;

            let txProductId: string | undefined, txProductName: string | undefined;
            let txQuantity: number | undefined, txUnitBuyPrice: number | undefined;
            let txUnitSellPrice: number | undefined, txUnit: string | undefined;
            let txContactId: string | undefined;

            if (isSale && selectedProduct) {
                const result = sellProduct(selectedProduct.id, parsedQty, selectedProduct.sellingPrice);
                if (!result.success) { Alert.alert(t('common.error'), result.message); setIsSubmitting(false); return; }
                if (result.lowStockWarning) setLowStockWarning(result.lowStockWarning);
                txProductId = selectedProduct.id; txProductName = selectedProduct.name;
                txQuantity = parsedQty; txUnitBuyPrice = selectedProduct.purchasePrice;
                txUnitSellPrice = selectedProduct.sellingPrice; txUnit = selectedProduct.unit;
            }

            if (isPurchase) {
                addRecentUnit(purchaseUnit);
                addRecentCategory(purchaseCategory || 'অন্যান্য');
                const product = purchaseProduct(purchaseProductName.trim(), parsedPurchaseQty, parsedPurchasePrice, parseFloat(purchaseSellPrice) || 0, purchaseUnit, purchaseCategory || 'অন্যান্য');
                txProductId = product.id; txProductName = product.name;
                txQuantity = parsedPurchaseQty; txUnitBuyPrice = parsedPurchasePrice;
                txUnit = purchaseUnit;
            }

            if (contactName.trim() && (isSale || isPurchase)) {
                const contactType = isSale ? 'customer' : 'supplier';
                const contact = getOrCreateContact(contactName.trim(), contactType as any, contactPhone.trim() || undefined);
                txContactId = contact.id;
                if (finalDue > 0) {
                    const balanceChange = isSale ? finalDue : -finalDue;
                    updateBalance(contact.id, balanceChange);
                }
            }

            addRecentPaymentMethod(paymentMethod);

            const transaction: Transaction = {
                id: localId, localId, type: transactionType,
                referenceNumber: `${transactionType.toUpperCase().slice(0, 3)}-${Date.now() % 1000000}`,
                contactId: txContactId, contactName: contactName.trim() || undefined,
                productId: txProductId, productName: txProductName,
                quantity: txQuantity, unitBuyPrice: txUnitBuyPrice,
                unitSellPrice: txUnitSellPrice, unit: txUnit,
                expenseCategory: isExpense ? expenseCategory : undefined,
                amount: finalAmount, paidAmount: finalPaid, dueAmount: finalDue,
                discount: 0, notes: notes || undefined,
                paymentMethod: paymentMethod as any,
                receiptImage: receiptImage || undefined,
                date: new Date(), isSynced: false, createdAt: new Date(), updatedAt: new Date(),
            };

            await addTransaction(transaction);
            if (!isOnline) addToQueue({ type: 'transaction', action: 'create', data: transaction });

            let successMsg = '';
            if (isSale && selectedProduct) successMsg = t('transactions.soldSuccess', { name: selectedProduct.name, qty: parsedQty, unit: selectedProduct.unit, amount: formatCurrency(finalAmount) });
            else if (isPurchase) successMsg = t('transactions.purchaseSuccess', { name: purchaseProductName.trim(), qty: parsedPurchaseQty, unit: purchaseUnit, amount: formatCurrency(finalAmount) });
            else successMsg = t('transactions.expenseSuccess', { amount: formatCurrency(finalAmount) });
            if (finalDue > 0) successMsg += `\n${t('transactions.dueRemains', { amount: formatCurrency(finalDue) })}`;

            Alert.alert(`✅ ${t('common.success')}!`, successMsg, [{ text: 'OK', onPress: () => { if (!lowStockWarning) navigation.goBack(); } }]);
            if (lowStockWarning) setTimeout(() => navigation.goBack(), 3500);
        } catch (error) {
            Alert.alert(t('common.error'), t('transactions.errorSaving'));
        } finally { setIsSubmitting(false); }
    };

    const canSubmit = () => {
        if (isSale) return !!selectedProduct && parsedQty > 0;
        if (isPurchase) return !!purchaseProductName.trim() && parsedPurchaseQty > 0 && parsedPurchasePrice > 0;
        if (isExpense) return parsedAmount > 0;
        return false;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LowStockAlert warning={lowStockWarning} onDismiss={() => setLowStockWarning(null)} />
            <BarcodeScannerModal
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onBarcodeScanned={handleBarcodeScanned}
                onPhotoTaken={(uri) => {
                    setReceiptImage(uri);
                    setShowScanner(false);
                }}
            />
            <VoiceConfirmationModal
                visible={showVoiceConfirm}
                data={voiceData}
                productOptions={productDropdownOptions}
                contactOptions={contactDropdownOptions}
                onConfirm={handleVoiceConfirm}
                onCancel={() => setShowVoiceConfirm(false)}
            />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('transactions.addTransaction')}</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)}>
                            <Ionicons name="barcode-outline" size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Transaction Type Selection */}
                    <Text style={styles.sectionTitle}>{t('transactions.transactionType')}</Text>
                    <View style={styles.typeGrid}>
                        {TRANSACTION_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.key}
                                style={[styles.typeButton, transactionType === type.key && { borderColor: type.color, borderWidth: 2 }]}
                                onPress={() => { setTransactionType(type.key); setSelectedProduct(null); setQuantity(''); setAmount(''); }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                                    <Ionicons name={type.icon as any} size={24} color={type.color} />
                                </View>
                                <Text style={[styles.typeLabel, transactionType === type.key && { color: type.color, fontWeight: '600' }]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ===== SALE FIELDS ===== */}
                    {isSale && (
                        <>
                            <Text style={styles.sectionTitle}>{t('transactions.selectProduct')}</Text>
                            {/* Scan + Pick Row */}
                            <View style={styles.scanPickRow}>
                                <TouchableOpacity style={styles.productPickerBtn} onPress={() => setShowProductPicker(true)}>
                                    <Ionicons name="cube-outline" size={22} color={selectedProduct ? COLORS.primary : COLORS.gray400} />
                                    <Text style={[styles.productPickerText, selectedProduct && { color: COLORS.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
                                        {selectedProduct ? `${selectedProduct.name} (${formatCurrency(selectedProduct.sellingPrice)}/${selectedProduct.unit})` : t('transactions.chooseProduct')}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.scanPickBtn} onPress={() => setShowScanner(true)}>
                                    <Ionicons name="scan-outline" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>

                            {selectedProduct && (
                                <>
                                    <Text style={styles.sectionTitle}>{t('transactions.quantity')} ({selectedProduct.unit})</Text>
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(String(Math.max(1, parsedQty - 1)))}>
                                            <Ionicons name="remove" size={22} color={COLORS.white} />
                                        </TouchableOpacity>
                                        <TextInput style={styles.qtyInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" textAlign="center" />
                                        <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: COLORS.success }]} onPress={() => setQuantity(String(parsedQty + 1))}>
                                            <Ionicons name="add" size={22} color={COLORS.white} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.stockHint}>{t('transactions.stockLabel')}: {selectedProduct.stock} {selectedProduct.unit}</Text>
                                    <View style={styles.autoAmountCard}>
                                        <Text style={styles.autoAmountLabel}>{t('transactions.totalPrice')}</Text>
                                        <Text style={styles.autoAmountValue}>{formatCurrency(autoSaleAmount)}</Text>
                                        <Text style={styles.autoAmountBreakdown}>{formatCurrency(selectedProduct.sellingPrice)} × {parsedQty} {selectedProduct.unit}</Text>
                                        <Text style={[styles.autoAmountBreakdown, { color: COLORS.success }]}>
                                            {t('transactions.profit')}: {formatCurrency((selectedProduct.sellingPrice - selectedProduct.purchasePrice) * parsedQty)}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </>
                    )}

                    {/* ===== PURCHASE FIELDS ===== */}
                    {isPurchase && (
                        <>
                            {/* Product Name Dropdown */}
                            <SmartDropdown
                                label={t('transactions.productNameLabel')}
                                placeholder={t('transactions.productNamePlaceholder')}
                                options={productDropdownOptions}
                                selectedValue={purchaseProductName}
                                onSelect={(o) => {
                                    setPurchaseProductName(o.value);
                                    const existing = getProductByName(o.value);
                                    if (existing) {
                                        setPurchaseUnit(existing.unit);
                                        setPurchaseCategory(existing.category);
                                        setPurchaseUnitPrice(existing.purchasePrice.toString());
                                        setPurchaseSellPrice(existing.sellingPrice.toString());
                                    }
                                }}
                                allowCustom
                                customLabel="+ নতুন পণ্য যোগ করুন"
                                onCustom={(text) => setPurchaseProductName(text)}
                                icon="cube-outline"
                            />

                            <View style={styles.rowFields}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>{t('transactions.quantityLabel')}</Text>
                                    <TextInput style={styles.textInputField} value={purchaseQty} onChangeText={setPurchaseQty} placeholder="0" placeholderTextColor={COLORS.gray400} keyboardType="numeric" />
                                </View>
                                <View style={{ width: SPACING.sm }} />
                                <View style={{ flex: 1 }}>
                                    <SmartDropdown
                                        label={t('transactions.unitLabel')}
                                        placeholder={t('transactions.unitPlaceholder')}
                                        options={UNIT_OPTIONS}
                                        selectedValue={purchaseUnit}
                                        onSelect={(o) => setPurchaseUnit(o.value)}
                                        recentValues={recentUnits}
                                        allowCustom
                                        customLabel="+ নতুন একক"
                                        onCustom={(text) => setPurchaseUnit(text)}
                                    />
                                </View>
                            </View>

                            <View style={styles.rowFields}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>{t('transactions.buyPriceLabel')}</Text>
                                    <TextInput style={styles.textInputField} value={purchaseUnitPrice} onChangeText={setPurchaseUnitPrice} placeholder="৳ 0" placeholderTextColor={COLORS.gray400} keyboardType="numeric" />
                                </View>
                                <View style={{ width: SPACING.sm }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>{t('transactions.sellPriceLabel')}</Text>
                                    <TextInput style={styles.textInputField} value={purchaseSellPrice} onChangeText={setPurchaseSellPrice} placeholder="৳ 0" placeholderTextColor={COLORS.gray400} keyboardType="numeric" />
                                </View>
                            </View>

                            {/* Category Dropdown */}
                            <SmartDropdown
                                label={t('transactions.categoryPlaceholder')}
                                placeholder="ক্যাটাগরি নির্বাচন করুন"
                                options={CATEGORY_OPTIONS}
                                selectedValue={purchaseCategory}
                                onSelect={(o) => setPurchaseCategory(o.value)}
                                recentValues={recentCategories}
                                allowCustom
                                customLabel="+ নতুন ক্যাটাগরি"
                                onCustom={(text) => setPurchaseCategory(text)}
                            />

                            {autoPurchaseAmount > 0 && (
                                <View style={[styles.autoAmountCard, { borderColor: COLORS.error + '30' }]}>
                                    <Text style={[styles.autoAmountLabel, { color: COLORS.error }]}>{t('transactions.totalBuyPrice')}</Text>
                                    <Text style={[styles.autoAmountValue, { color: COLORS.error }]}>{formatCurrency(autoPurchaseAmount)}</Text>
                                    <Text style={styles.autoAmountBreakdown}>{formatCurrency(parsedPurchasePrice)} × {parsedPurchaseQty} {purchaseUnit}</Text>
                                </View>
                            )}
                        </>
                    )}

                    {/* ===== EXPENSE FIELDS ===== */}
                    {isExpense && (
                        <>
                            <Text style={styles.sectionTitle}>{t('transactions.expenseTypeLabel')}</Text>
                            <View style={styles.expenseCategoryGrid}>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <TouchableOpacity key={cat.key}
                                        style={[styles.expenseCategoryBtn, expenseCategory === cat.key && { borderColor: COLORS.warning, borderWidth: 2 }]}
                                        onPress={() => setExpenseCategory(cat.key)}>
                                        <Ionicons name={cat.icon as any} size={20} color={expenseCategory === cat.key ? COLORS.warning : COLORS.gray500} />
                                        <Text style={[styles.expenseCategoryLabel, expenseCategory === cat.key && { color: COLORS.warning, fontWeight: '600' }]}>{t(cat.labelKey)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.sectionTitle}>{t('transactions.amount')}</Text>
                            <View style={styles.amountContainer}>
                                <Text style={styles.currencySymbol}>৳</Text>
                                <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor={COLORS.gray300} keyboardType="numeric" autoFocus />
                            </View>
                        </>
                    )}

                    {/* Payment Method Dropdown */}
                    <SmartDropdown
                        label="পেমেন্ট মাধ্যম"
                        placeholder="পেমেন্ট পদ্ধতি নির্বাচন করুন"
                        options={PAYMENT_OPTIONS}
                        selectedValue={paymentMethod}
                        onSelect={(o) => setPaymentMethod(o.value)}
                        recentValues={recentPaymentMethods}
                    />

                    {/* Paid Amount (sale & purchase) */}
                    {hasDueSupport && parsedAmount > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>{t('transactions.paidAmountLabel')}</Text>
                            <View style={styles.amountContainer}>
                                <Text style={[styles.currencySymbol, { fontSize: FONT_SIZES.xl }]}>৳</Text>
                                <TextInput style={[styles.amountInput, { fontSize: FONT_SIZES.xl }]} value={paidAmountStr} onChangeText={setPaidAmountStr} placeholder={parsedAmount.toString()} placeholderTextColor={COLORS.gray300} keyboardType="numeric" />
                            </View>
                            {dueAmount > 0 && (
                                <View style={styles.dueInfoRow}>
                                    <Ionicons name={isSale ? 'arrow-down-circle' : 'arrow-up-circle'} size={20} color={isSale ? COLORS.success : COLORS.error} />
                                    <Text style={[styles.dueInfoText, { color: isSale ? COLORS.success : COLORS.error }]}>
                                        {isSale ? t('transactions.receivableDue') : t('transactions.payableDue')}: ৳{dueAmount}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    {/* Contact Dropdown (sale & purchase) */}
                    {(isSale || isPurchase) && (
                        <>
                            <SmartDropdown
                                label={isSale ? t('transactions.customerName') : t('transactions.supplierName')}
                                placeholder={isSale ? t('transactions.customerNamePlaceholder') : t('transactions.supplierNamePlaceholder')}
                                options={contactDropdownOptions}
                                selectedValue={contactName}
                                onSelect={(o) => { setContactName(o.label); if (o.subtitle) setContactPhone(o.subtitle); }}
                                allowCustom
                                customLabel="+ নতুন যোগ করুন"
                                onCustom={(text) => { setContactName(text); setContactPhone(''); }}
                                icon="person-outline"
                            />

                            {contactName.trim() !== '' && (
                                <>
                                    <Text style={styles.sectionTitle}>{t('transactions.contactPhone')}</Text>
                                    <View style={styles.contactPicker}>
                                        <Ionicons name="call-outline" size={20} color={COLORS.gray400} />
                                        <TextInput style={styles.contactInput} value={contactPhone} onChangeText={setContactPhone} placeholder={t('transactions.contactPhonePlaceholder')} placeholderTextColor={COLORS.gray400} keyboardType="phone-pad" />
                                    </View>
                                </>
                            )}
                        </>
                    )}

                    {/* Notes */}
                    <Text style={styles.sectionTitle}>{t('transactions.notes')}</Text>
                    <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes} placeholder={t('transactions.notesPlaceholder')} placeholderTextColor={COLORS.gray400} multiline numberOfLines={3} />

                    {receiptImage && (
                        <View style={styles.receiptImageContainer}>
                            <Image source={{ uri: receiptImage }} style={styles.receiptPreview} borderBottomRightRadius={8} borderTopLeftRadius={8} borderTopRightRadius={8} borderBottomLeftRadius={8}/>
                            <TouchableOpacity style={styles.removeReceiptBtn} onPress={() => setReceiptImage(null)}>
                                <Ionicons name="close-circle" size={24} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Footer with Submit + Voice */}
                <View style={styles.footer}>
                    <View style={styles.footerRow}>
                        {voiceModeEnabled && (
                            <VoiceInputButton onTextCaptured={handleVoiceText} isEnabled={voiceModeEnabled} />
                        )}
                        <TouchableOpacity
                            style={[styles.submitButton, (!canSubmit() || isSubmitting) && styles.submitButtonDisabled, voiceModeEnabled && { flex: 1 }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !canSubmit()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.submitButtonText}>{isSubmitting ? t('common.saving') : t('common.save')}</Text>
                        </TouchableOpacity>
                    </View>
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
                            <TextInput style={styles.modalSearchInput} placeholder={t('inventory.searchProducts')} placeholderTextColor={COLORS.gray400} value={productSearch} onChangeText={setProductSearch} autoFocus />
                        </View>
                        {/* Scan button inside picker */}
                        <TouchableOpacity style={styles.scanInsideBtn} onPress={() => { setShowProductPicker(false); setShowScanner(true); }}>
                            <Ionicons name="scan-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.scanInsideBtnText}>{t('scanner.scanToFind')}</Text>
                        </TouchableOpacity>
                        <FlatList
                            data={filteredProducts}
                            keyExtractor={item => item.id}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.productItem} onPress={() => handleSelectProduct(item)}>
                                    <View style={styles.productItemLeft}>
                                        <Text style={styles.productItemName}>{item.name}</Text>
                                        <Text style={styles.productItemSub}>{t('transactions.stockLabel')}: {item.stock} {item.unit} • {item.category}</Text>
                                    </View>
                                    <Text style={styles.productItemPrice}>{formatCurrency(item.sellingPrice)}/{item.unit}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.textMuted }}>{products.length === 0 ? t('transactions.selectProductHint') : t('inventory.noProducts')}</Text>
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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    scanBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '10',
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    content: { flex: 1, padding: SPACING.lg },
    sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
    typeGrid: { flexDirection: 'row', gap: SPACING.sm },
    typeButton: {
        flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
    },
    typeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    typeLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
    scanPickRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
    productPickerBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200, gap: SPACING.sm,
    },
    productPickerText: { flex: 1, fontSize: FONT_SIZES.base, color: COLORS.gray400 },
    scanPickBtn: {
        width: 48, height: 48, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center',
    },
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
        borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
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
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    submitButton: {
        flex: 1, backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md, alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
    scanInsideBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.primary + '10', borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.sm, marginBottom: SPACING.md, gap: SPACING.sm,
    },
    scanInsideBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
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
    receiptImageContainer: {
        marginTop: SPACING.md, position: 'relative', width: 120, height: 160,
        borderRadius: BORDER_RADIUS.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, backgroundColor: COLORS.white,
    },
    receiptPreview: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.md, resizeMode: 'cover' },
    removeReceiptBtn: {
        position: 'absolute', top: -10, right: -10, backgroundColor: COLORS.white,
        borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2, shadowRadius: 2,
    },
});
