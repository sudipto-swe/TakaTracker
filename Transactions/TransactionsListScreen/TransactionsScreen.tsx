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
