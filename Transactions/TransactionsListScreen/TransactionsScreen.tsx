import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTransactionStore, Transaction } from '../../store/transactionStore';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageContext';

export const TransactionsScreen: React.FC = () => {
    const { language } = useLanguage();
    const { transactions } = useTransactionStore();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempYear, setTempYear] = useState(new Date().getFullYear());
    const [tempMonth, setTempMonth] = useState(new Date().getMonth());

    const TRANSACTION_FILTERS = [
        { key: 'all', label: t('common.all') },
        { key: 'sale', label: t('transactions.sale') },
        { key: 'purchase', label: t('transactions.purchase') },
        { key: 'expense', label: t('transactions.expense') },
    ];
    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx: Transaction) => {
            const matchesFilter = activeFilter === 'all' || tx.type === activeFilter;
            const matchesSearch = !searchQuery ||
                (tx.contactName && tx.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (tx.productName && tx.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                tx.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesDate = true;
            if (selectedDate) {
                const txDate = new Date(tx.date);
                matchesDate = txDate.getFullYear() === selectedDate.getFullYear() &&
                    txDate.getMonth() === selectedDate.getMonth() &&
                    txDate.getDate() === selectedDate.getDate();
            }

            return matchesFilter && matchesSearch && matchesDate;
        });
    }, [transactions, activeFilter, searchQuery, selectedDate]);

     const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            sale: t('transactions.sale'),
            purchase: t('transactions.purchase'),
            expense: t('transactions.expense'),
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: string) => {
        if (type === 'sale') return COLORS.success;
        if (type === 'purchase') return COLORS.error;
        return COLORS.warning;
    };

    const getDateString = (date: Date) => {
        try {
            const d = new Date(date);
            return d.toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return '';
        }
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handleSelectDate = (day: number) => {
        const newDate = new Date(tempYear, tempMonth, day);
        setSelectedDate(newDate);
        setShowDatePicker(false);
    };

    const clearDateFilter = () => {
        setSelectedDate(null);
    };

    const monthNames = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(tempYear, tempMonth);
        const firstDay = getFirstDayOfMonth(tempYear, tempMonth);
        const days: (number | null)[] = [];

        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        const rows: (number | null)[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            rows.push(days.slice(i, i + 7));
        }
        // Pad last row
        while (rows.length > 0 && rows[rows.length - 1].length < 7) {
            rows[rows.length - 1].push(null);
        }

        const today = new Date();
        const isToday = (day: number) =>
            day === today.getDate() && tempMonth === today.getMonth() && tempYear === today.getFullYear();

        const isSelected = (day: number) =>
            selectedDate && day === selectedDate.getDate() && tempMonth === selectedDate.getMonth() && tempYear === selectedDate.getFullYear();
          return (
            <View>
                {/* Month nav */}
                <View style={calStyles.monthNav}>
                    <TouchableOpacity onPress={() => {
                        if (tempMonth === 0) { setTempMonth(11); setTempYear(tempYear - 1); }
                        else setTempMonth(tempMonth - 1);
                    }}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={calStyles.monthTitle}>{monthNames[tempMonth]} {tempYear}</Text>
                    <TouchableOpacity onPress={() => {
                        if (tempMonth === 11) { setTempMonth(0); setTempYear(tempYear + 1); }
                        else setTempMonth(tempMonth + 1);
                    }}>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Day headers */}
                <View style={calStyles.dayHeaderRow}>
                    {dayNames.map((d, i) => (
                        <Text key={i} style={calStyles.dayHeader}>{d}</Text>
                    ))}
                </View>

                {/* Calendar grid */}
                {rows.map((row, ri) => (
                    <View key={ri} style={calStyles.weekRow}>
                        {row.map((day, di) => (
                            <TouchableOpacity
                                key={di}
                                style={[
                                    calStyles.dayCell,
                                    day ? (isToday(day) ? calStyles.todayCell : undefined) : undefined,
                                    day ? (isSelected(day) ? calStyles.selectedCell : undefined) : undefined,
                                ]}
                                onPress={() => day && handleSelectDate(day)}
                                disabled={!day}
                            >
                                <Text style={[
                                    calStyles.dayText,
                                    day ? (isToday(day) ? calStyles.todayText : undefined) : undefined,
                                    day ? (isSelected(day) ? calStyles.selectedText : undefined) : undefined,
                                    !day ? { color: 'transparent' } : undefined,
                                ]}>
                                    {day || ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const isIncome = item.type === 'sale';

        return (
            <TouchableOpacity style={styles.transactionCard} activeOpacity={0.7}>
                <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]} />
                <View style={styles.transactionContent}>
                    <View style={styles.transactionHeader}>
                        <Text style={styles.contactName}>
                            {item.productName || item.contactName || getTypeLabel(item.type)}
                        </Text>
                        <Text style={[styles.amount, { color: getTypeColor(item.type) }]}>
                            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                        </Text>
                    </View>
                    <View style={styles.transactionFooter}>
                        <View style={styles.typeTag}>
                            <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            {!item.isSynced && (
                                <Ionicons name="cloud-offline-outline" size={14} color={COLORS.warning} style={{ marginRight: 4 }} />
                            )}
                            <Text style={styles.dateText}>{getDateString(item.date)}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

     return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{t('transactions.title')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    {selectedDate && (
                        <TouchableOpacity onPress={clearDateFilter} style={styles.clearDateBtn}>
                            <Text style={styles.clearDateText}>
                                {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
                            </Text>
                            <Ionicons name="close-circle" size={16} color={COLORS.error} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.filterButton, selectedDate && { backgroundColor: COLORS.primary + '15' }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={24}
                            color={selectedDate ? COLORS.primary : COLORS.textPrimary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray400} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('common.search')}
                    placeholderTextColor={COLORS.gray400}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
                <FlatList
                    data={TRANSACTION_FILTERS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={styles.filterTabsContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterTab,
                                activeFilter === item.key && styles.filterTabActive,
                            ]}
                            onPress={() => setActiveFilter(item.key)}
                        >
                            <Text style={[
                                styles.filterTabText,
                                activeFilter === item.key && styles.filterTabTextActive,
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
            
            {/* Transactions List */}
            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransaction}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={COLORS.gray300} />
                        <Text style={styles.emptyText}>
                            {selectedDate
                                ? 'এই তারিখে কোনো লেনদেন নেই'
                                : t('dashboard.noTransactions')}
                        </Text>
                    </View>
                }
            />

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} animationType="fade" transparent>
                <View style={calStyles.overlay}>
                    <View style={calStyles.modal}>
                        <View style={calStyles.header}>
                            <Text style={calStyles.headerTitle}>তারিখ নির্বাচন করুন</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        {renderCalendar()}
                        <View style={calStyles.footer}>
                            <TouchableOpacity
                                style={calStyles.todayBtn}
                                onPress={() => {
                                    const today = new Date();
                                    setTempYear(today.getFullYear());
                                    setTempMonth(today.getMonth());
                                    handleSelectDate(today.getDate());
                                }}
                            >
                                <Text style={calStyles.todayBtnText}>আজকে</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={calStyles.clearBtn}
                                onPress={() => { clearDateFilter(); setShowDatePicker(false); }}
                            >
                                <Text style={calStyles.clearBtnText}>ফিল্টার মুছুন</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};


const calStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modal: {
        backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg, width: '90%', maxWidth: 400,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
    monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    monthTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
    dayHeaderRow: { flexDirection: 'row', marginBottom: SPACING.xs },
    dayHeader: {
        flex: 1, textAlign: 'center', fontSize: FONT_SIZES.xs, fontWeight: '600',
        color: COLORS.textSecondary, paddingVertical: SPACING.xs,
    },
    weekRow: { flexDirection: 'row' },
    dayCell: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
    },
    dayText: { fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
    todayCell: { backgroundColor: COLORS.primary + '15' },
    todayText: { color: COLORS.primary, fontWeight: '600' },
    selectedCell: { backgroundColor: COLORS.primary },
    selectedText: { color: COLORS.white, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, gap: SPACING.md },
    todayBtn: {
        flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary, alignItems: 'center',
    },
    todayBtnText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZES.sm },
    clearBtn: {
        flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray100, alignItems: 'center',
    },
    clearBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZES.sm },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    },
    title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary },
    filterButton: { padding: SPACING.xs, borderRadius: BORDER_RADIUS.md },
    clearDateBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full,
    },
    clearDateText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg, marginVertical: SPACING.md,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200,
    },
    searchInput: { flex: 1, marginLeft: SPACING.sm, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
    filterTabs: {
        backgroundColor: COLORS.white, paddingBottom: SPACING.sm,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    filterTabsContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
    filterTab: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray100,
    },
    filterTabActive: { backgroundColor: COLORS.primary },
    filterTabText: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textSecondary },
    filterTabTextActive: { color: COLORS.white },
    listContent: { padding: SPACING.lg, paddingBottom: 20 },
    transactionCard: {
        flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOWS.sm,
    },
    typeIndicator: { width: 4 },
    transactionContent: { flex: 1, padding: SPACING.md },
    transactionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs,
    },
    contactName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
    amount: { fontSize: FONT_SIZES.md, fontWeight: 'bold' },
    transactionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    typeTag: {
        backgroundColor: COLORS.gray100, paddingHorizontal: SPACING.sm,
        paddingVertical: 2, borderRadius: BORDER_RADIUS.sm,
    },
    typeText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    emptyState: { alignItems: 'center', paddingTop: SPACING['3xl'] },
    emptyText: { fontSize: FONT_SIZES.base, color: COLORS.textMuted, marginTop: SPACING.md, textAlign: 'center' },
});
