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

type AddContactRouteProp = RouteProp<RootStackParamList, 'AddContact'>;

export const AddContactScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<AddContactRouteProp>();
    const { addContact } = useContactStore();

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
            newErrors.name = 'নাম দিন';
        }

        if (phone && !/^01[0-9]{9}$/.test(phone)) {
            newErrors.phone = 'সঠিক ফোন নম্বর দিন (01XXXXXXXXX)';
        }

        if (creditLimit && isNaN(Number(creditLimit))) {
            newErrors.creditLimit = 'সঠিক পরিমাণ দিন';
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
                'সফল',
                'যোগাযোগ সংরক্ষিত হয়েছে',
                [{ text: 'ঠিক আছে', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert('ত্রুটি', 'যোগাযোগ সংরক্ষণ করা যায়নি');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title={contactType === 'customer' ? 'নতুন গ্রাহক' : 'নতুন সরবরাহকারী'}
                showBack
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Contact Type Selection */}
                    <Card style={styles.typeCard}>
                        <Text style={styles.sectionTitle}>ধরন নির্বাচন করুন</Text>
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
                                    গ্রাহক
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
                                    সরবরাহকারী
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Contact Details */}
                    <Card style={styles.formCard}>
                        <Input
                            label="নাম"
                            placeholder="যোগাযোগের নাম"
                            value={name}
                            onChangeText={setName}
                            error={errors.name}
                            touched={!!errors.name}
                            required
                            testID="contact-name-input"
                        />

                        <Input
                            label="ফোন নম্বর"
                            placeholder="01XXXXXXXXX"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            error={errors.phone}
                            touched={!!errors.phone}
                            testID="contact-phone-input"
                        />

                        <Input
                            label="ঠিকানা"
                            placeholder="ঠিকানা (ঐচ্ছিক)"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={2}
                            testID="contact-address-input"
                        />

                        <Input
                            label="ক্রেডিট সীমা"
                            placeholder="০"
                            value={creditLimit}
                            onChangeText={setCreditLimit}
                            keyboardType="numeric"
                            error={errors.creditLimit}
                            touched={!!errors.creditLimit}
                            hint={creditLimit ? `সর্বোচ্চ: ${formatCurrency(Number(creditLimit))}` : undefined}
                        />

                        <Input
                            label="নোট"
                            placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)"
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
                        title="সংরক্ষণ করুন"
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
