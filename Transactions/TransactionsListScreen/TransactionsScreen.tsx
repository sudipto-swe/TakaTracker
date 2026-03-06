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
