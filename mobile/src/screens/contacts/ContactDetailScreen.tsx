/**
 * Contact Detail Screen
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header, AmountDisplay } from '../../components/common';
import { Button, Card, Badge } from '../../components/ui';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t, formatCurrency, formatDate } from '../../i18n';
import { useContactStore } from '../../store/contactStore';
import { useTransactionStore } from '../../store/transactionStore';
import { RootStackParamList } from '../../navigation/types';

type ContactDetailRouteProp = RouteProp<RootStackParamList, 'ContactDetail'>;

export const ContactDetailScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<ContactDetailRouteProp>();
    const { contacts } = useContactStore();
    const { transactions } = useTransactionStore();

    const contactId = route.params?.id;
    const contact = contacts.find(c => c.id === contactId);

    // Get transactions for this contact
    const contactTransactions = transactions
        .filter(t => t.contactId === contactId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!contact) {
        return (
            <SafeAreaView style={styles.container}>
                <Header title="যোগাযোগ" showBack />
                <View style={styles.notFound}>
                    <Text style={styles.notFoundText}>যোগাযোগ পাওয়া যায়নি</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isCustomer = contact.type === 'customer';
    const balanceColor = contact.balance >= 0 ? 'success' : 'danger';
    const balanceLabel = isCustomer
        ? (contact.balance >= 0 ? 'পাওনা' : 'দেনা')
        : (contact.balance <= 0 ? 'দিতে হবে' : 'পাবে');

    const handleAddTransaction = () => {
        navigation.navigate('AddTransaction', {
            type: isCustomer ? 'sale' : 'purchase',
            contactId: contact.id,
        });
    };

    const handleRecordPayment = () => {
        navigation.navigate('AddTransaction', {
            type: isCustomer ? 'sale' : 'purchase',
            contactId: contact.id,
        });
    };

    const handleCall = () => {
        if (contact.phone) {
            // In real app, use Linking.openURL
            Alert.alert('কল করুন', contact.phone);
        }
    };

    const renderTransaction = ({ item }: { item: any }) => {
        const typeLabels: Record<string, string> = {
            sale: 'বিক্রয়',
            purchase: 'ক্রয়',
            payment_in: 'টাকা পেয়েছি',
            payment_out: 'টাকা দিয়েছি',
            expense: 'খরচ',
        };

        return (
            <TouchableOpacity style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                    <Text style={styles.transactionType}>
                        {typeLabels[item.type] || item.type}
                    </Text>
                    <Text style={styles.transactionDate}>
                        {formatDate(new Date(item.date))}
                    </Text>
                </View>
                <AmountDisplay
                    amount={item.amount}
                    color={item.type.includes('payment') || item.type === 'purchase' ? 'danger' : 'success'}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title={contact.name}
                subtitle={isCustomer ? 'গ্রাহক' : 'সরবরাহকারী'}
                showBack
                rightAction={
                    contact.phone ? (
                        <TouchableOpacity onPress={handleCall}>
                            <Text style={styles.callButton}>📞</Text>
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <Card style={styles.balanceCard} variant="elevated">
                    <Text style={styles.balanceLabel}>{balanceLabel}</Text>
                    <AmountDisplay
                        amount={Math.abs(contact.balance)}
                        size="xl"
                        color={balanceColor}
                    />
                    {contact.creditLimit > 0 && (
                        <Text style={styles.creditLimit}>
                            ক্রেডিট সীমা: {formatCurrency(contact.creditLimit)}
                        </Text>
                    )}
                </Card>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionSale]}
                        onPress={handleAddTransaction}
                        testID="add-transaction-for-contact"
                    >
                        <Text style={styles.actionIcon}>
                            {isCustomer ? '💰' : '🛒'}
                        </Text>
                        <Text style={styles.actionText}>
                            {isCustomer ? 'বিক্রয়' : 'ক্রয়'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionPayment]}
                        onPress={handleRecordPayment}
                        testID="record-payment-button"
                    >
                        <Text style={styles.actionIcon}>💵</Text>
                        <Text style={styles.actionText}>
                            {isCustomer ? 'টাকা নিন' : 'টাকা দিন'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Contact Info */}
                <Card style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>যোগাযোগের তথ্য</Text>

                    {contact.phone && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>ফোন</Text>
                            <Text style={styles.infoValue}>{contact.phone}</Text>
                        </View>
                    )}

                    {contact.address && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>ঠিকানা</Text>
                            <Text style={styles.infoValue}>{contact.address}</Text>
                        </View>
                    )}

                    {contact.notes && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>নোট</Text>
                            <Text style={styles.infoValue}>{contact.notes}</Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>সিঙ্ক স্ট্যাটাস</Text>
                        <Badge
                            label={contact.isSynced ? 'সিঙ্ক হয়েছে' : 'পেন্ডিং'}
                            variant={contact.isSynced ? 'success' : 'warning'}
                            size="sm"
                        />
                    </View>
                </Card>

                {/* Transaction History */}
                <Card style={styles.transactionCard}>
                    <Text style={styles.sectionTitle}>লেনদেন ইতিহাস</Text>

                    {contactTransactions.length === 0 ? (
                        <Text style={styles.emptyText}>কোনো লেনদেন নেই</Text>
                    ) : (
                        <FlatList
                            data={contactTransactions}
                            renderItem={renderTransaction}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            testID="contact-transactions-list"
                        />
                    )}
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notFoundText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
    },
    balanceCard: {
        margin: SPACING.base,
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    balanceLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    creditLimit: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.sm,
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.base,
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
    },
    actionSale: {
        backgroundColor: COLORS.secondary,
    },
    actionPayment: {
        backgroundColor: COLORS.primary,
    },
    actionIcon: {
        fontSize: 20,
    },
    actionText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: FONT_SIZES.base,
    },
    infoCard: {
        marginHorizontal: SPACING.base,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    infoLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    infoValue: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textPrimary,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    transactionCard: {
        marginHorizontal: SPACING.base,
        marginBottom: SPACING.xl,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    transactionLeft: {
        flex: 1,
    },
    transactionType: {
        fontSize: FONT_SIZES.base,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    transactionDate: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.gray100,
    },
    emptyText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingVertical: SPACING.lg,
    },
    callButton: {
        fontSize: 24,
    },
});

export default ContactDetailScreen;
