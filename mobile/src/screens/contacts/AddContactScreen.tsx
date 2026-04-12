/**
 * Add/Edit Contact Screen
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from '../../components/common';
import { Button, Input, Card } from '../../components/ui';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { t, formatCurrency } from '../../i18n';
import { useContactStore } from '../../store/contactStore';
import { RootStackParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';

type AddContactRouteProp = RouteProp<RootStackParamList, 'AddContact'>;

export const AddContactScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<AddContactRouteProp>();
    const { addContact } = useContactStore();
    const { language } = useLanguage();

    const initialType = route.params?.type || 'customer';

    const [contactType, setContactType] = useState<'customer' | 'supplier'>(initialType);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [creditLimit, setCreditLimit] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = t('contacts.nameRequired');
        }

        if (!phone.trim()) {
            newErrors.phone = t('contacts.phoneRequired');
        } else if (!/^01[0-9]{9}$/.test(phone)) {
            newErrors.phone = t('contacts.phoneInvalid');
        }

        if (creditLimit && isNaN(Number(creditLimit))) {
            newErrors.creditLimit = t('transactions.errorCorrectAmount');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            await addContact({
                id: `local_${Date.now()}`,
                localId: `local_${Date.now()}`,
                type: contactType,
                name: name.trim(),
                phone: phone.trim() || undefined,
                address: address.trim() || undefined,
                creditLimit: Number(creditLimit) || 0,
                notes: notes.trim() || undefined,
                balance: 0,
                isActive: true,
                isSynced: false,
            });

            Alert.alert(
                t('common.success'),
                t('contacts.saved'),
                [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert(t('common.error'), t('contacts.saveError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title={contactType === 'customer' ? t('contacts.addCustomer') : t('contacts.addSupplier')}
                showBack
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Contact Type Selection */}
                    <Card style={styles.typeCard}>
                        <Text style={styles.sectionTitle}>{t('contacts.selectType')}</Text>
                        <View style={styles.typeButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    contactType === 'customer' && styles.typeButtonActive,
                                ]}
                                onPress={() => setContactType('customer')}
                            >
                                <Text style={styles.typeIcon}>👤</Text>
                                <Text
                                    style={[
                                        styles.typeText,
                                        contactType === 'customer' && styles.typeTextActive,
                                    ]}
                                >
                                    {t('contacts.customerType')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    contactType === 'supplier' && styles.typeButtonActive,
                                ]}
                                onPress={() => setContactType('supplier')}
                            >
                                <Text style={styles.typeIcon}>🏭</Text>
                                <Text
                                    style={[
                                        styles.typeText,
                                        contactType === 'supplier' && styles.typeTextActive,
                                    ]}
                                >
                                    {t('contacts.supplierType')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Contact Details */}
                    <Card style={styles.formCard}>
                        <Input
                            label={t('contacts.contactName')}
                            placeholder={t('contacts.contactNamePlaceholder')}
                            value={name}
                            onChangeText={setName}
                            error={errors.name}
                            touched={!!errors.name}
                            required
                            testID="contact-name-input"
                        />

                        <Input
                            label={t('contacts.phone')}
                            placeholder={t('contacts.phonePlaceholder')}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            error={errors.phone}
                            touched={!!errors.phone}
                            required
                            testID="contact-phone-input"
                        />

                        <Input
                            label={t('contacts.address')}
                            placeholder={t('contacts.addressPlaceholder')}
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={2}
                            testID="contact-address-input"
                        />

                        <Input
                            label={t('contacts.creditLimit')}
                            placeholder={t('contacts.creditLimitPlaceholder')}
                            value={creditLimit}
                            onChangeText={setCreditLimit}
                            keyboardType="numeric"
                            error={errors.creditLimit}
                            touched={!!errors.creditLimit}
                            hint={creditLimit ? t('contacts.creditLimitHint', { amount: formatCurrency(Number(creditLimit)) }) : undefined}
                        />

                        <Input
                            label={t('transactions.notes')}
                            placeholder={t('contacts.notesPlaceholder')}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                        />
                    </Card>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.bottomActions}>
                    <Button
                        title={t('contacts.saveBtn')}
                        onPress={handleSave}
                        loading={isLoading}
                        disabled={isLoading}
                        fullWidth
                        testID="save-contact-button"
                    />
                </View>
            </KeyboardAvoidingView>
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
    typeCard: {
        margin: SPACING.base,
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    typeButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.base,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray100,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        backgroundColor: '#E0E7FF',
        borderColor: COLORS.primary,
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: SPACING.sm,
    },
    typeText: {
        fontSize: FONT_SIZES.base,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    typeTextActive: {
        color: COLORS.primary,
    },
    formCard: {
        margin: SPACING.base,
        marginTop: SPACING.sm,
    },
    bottomActions: {
        padding: SPACING.base,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
    },
});

export default AddContactScreen;
