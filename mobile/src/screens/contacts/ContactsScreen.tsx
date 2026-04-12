/**
 * Contacts Screen - Auto-populated from sales/purchases. No manual add.
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useContactStore, Contact } from '../../store/contactStore';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';
import { RootStackParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ContactsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { language } = useLanguage();
    const { contacts, customers, suppliers } = useContactStore();
    const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
    const [searchQuery, setSearchQuery] = useState('');

    const displayContacts = useMemo(() => {
        const list = activeTab === 'customers' ? customers : suppliers;
        if (!searchQuery) return list;
        return list.filter((c: Contact) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeTab, customers, suppliers, searchQuery]);

    const totalReceivable = useMemo(() =>
        customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0),
        [customers]
    );

    const totalPayable = useMemo(() =>
        suppliers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0),
        [suppliers]
    );

    const handleContactPress = (contact: Contact) => {
        navigation.navigate('ContactDetail', { id: contact.id });
    };

    const renderContact = ({ item }: { item: Contact }) => {
        const hasReceivable = item.balance > 0;
        const hasPayable = item.balance < 0;

        return (
            <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.7}
                onPress={() => handleContactPress(item)}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phone || t('contacts.noPhone')}</Text>
                </View>
                <View style={styles.balanceInfo}>
                    {item.balance !== 0 ? (
                        <>
                            <Text style={[
                                styles.balanceAmount,
                                { color: hasReceivable ? COLORS.receivable : COLORS.payable }
                            ]}>
                                {formatCurrency(Math.abs(item.balance))}
                            </Text>
                            <Text style={styles.balanceLabel}>
                                {hasReceivable ? t('contacts.receivable') : t('contacts.payable')}
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.settledText}>{t('contacts.settled')}</Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header with add button */}
            <View style={styles.header}>
                <Text style={styles.title}>{t('contacts.title')}</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddContact' as any, { type: activeTab === 'customers' ? 'customer' : 'supplier' })}
                    style={styles.addButton}
                >
                    <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'customers' && styles.tabActive]}
                    onPress={() => setActiveTab('customers')}
                >
                    <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>
                        {t('contacts.customers')} ({customers.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'suppliers' && styles.tabActive]}
                    onPress={() => setActiveTab('suppliers')}
                >
                    <Text style={[styles.tabText, activeTab === 'suppliers' && styles.tabTextActive]}>
                        {t('contacts.suppliers')} ({suppliers.length})
                    </Text>
                </TouchableOpacity>
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

            {/* Dues Summary */}
            <View style={styles.duesSummary}>
                <View style={styles.dueBox}>
                    <Text style={styles.dueLabel}>{t('contacts.receivableTotal')}</Text>
                    <Text style={[styles.dueAmount, { color: COLORS.receivable }]}>
                        {formatCurrency(totalReceivable)}
                    </Text>
                </View>
                <View style={styles.dueDivider} />
                <View style={styles.dueBox}>
                    <Text style={styles.dueLabel}>{t('contacts.payableTotal')}</Text>
                    <Text style={[styles.dueAmount, { color: COLORS.payable }]}>
                        {formatCurrency(totalPayable)}
                    </Text>
                </View>
            </View>

            {/* Contacts List */}
            <FlatList
                data={displayContacts}
                keyExtractor={(item) => item.id}
                renderItem={renderContact}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={COLORS.gray300} />
                        <Text style={styles.emptyText}>
                            {activeTab === 'customers'
                                ? t('contacts.autoAddCustomer')
                                : t('contacts.autoAddSupplier')}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    },
    addButton: {
        padding: SPACING.xs,
    },
    title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary },
    tabContainer: {
        flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    tab: {
        flex: 1, paddingVertical: SPACING.md, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: COLORS.primary },
    tabText: { fontSize: FONT_SIZES.md, fontWeight: '500', color: COLORS.textSecondary },
    tabTextActive: { color: COLORS.primary, fontWeight: '600' },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        marginHorizontal: SPACING.lg, marginVertical: SPACING.md,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray200,
    },
    searchInput: { flex: 1, marginLeft: SPACING.sm, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
    duesSummary: {
        flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.md, padding: SPACING.md, ...SHADOWS.sm,
    },
    dueBox: { flex: 1, alignItems: 'center' },
    dueDivider: { width: 1, backgroundColor: COLORS.gray200 },
    dueLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
    dueAmount: { fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
    listContent: { padding: SPACING.lg, paddingBottom: 20 },
    contactCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '20',
        justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
    },
    avatarText: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.primary },
    contactInfo: { flex: 1 },
    contactName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
    contactPhone: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
    balanceInfo: { alignItems: 'flex-end', marginRight: SPACING.sm },
    balanceAmount: { fontSize: FONT_SIZES.base, fontWeight: 'bold' },
    balanceLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
    settledText: { fontSize: FONT_SIZES.sm, color: COLORS.success, fontWeight: '500' },
    emptyState: { alignItems: 'center', paddingTop: SPACING['3xl'] },
    emptyText: {
        fontSize: FONT_SIZES.base, color: COLORS.textMuted, marginTop: SPACING.md,
        textAlign: 'center', paddingHorizontal: SPACING.xl,
    },
});
