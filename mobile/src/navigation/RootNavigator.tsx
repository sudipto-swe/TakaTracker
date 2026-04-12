/**
 * Root Navigator - Handles auth state, RBAC, and navigation structure.
 * Web-compatible version using regular Stack Navigator.
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { AbilityProvider } from '../rbac';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';
import { COLORS } from '../constants/theme';
import { backgroundSync } from '../services/syncService';

// Import modal/detail screens
import { AddTransactionScreen } from '../screens/transactions/AddTransactionScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { QRPaymentScreen } from '../screens/payments/QRPaymentScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { AddContactScreen } from '../screens/contacts/AddContactScreen';
import { ContactDetailScreen } from '../screens/contacts/ContactDetailScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { PredictionsScreen } from '../screens/dashboard/PredictionsScreen';
import { ChatBotScreen } from '../screens/chatbot/ChatBotScreen';

const Stack = createStackNavigator<RootStackParamList>();

// Web-specific linking config
const linking = {
    prefixes: ['http://localhost:8081', 'http://localhost:8085', 'takatracker://'],
    config: {
        screens: {
            Auth: {
                screens: {
                    Login: 'login',
                    Register: 'register',
                    OTP: 'otp',
                    ForgotPassword: 'forgot-password',
                    ResetPassword: 'reset-password',
                },
            },
            Main: {
                path: '',
                screens: {
                    Home: '',
                    Transactions: 'transactions',
                    Add: 'add',
                    Contacts: 'contacts',
                    More: 'more',
                },
            },
            AddTransaction: 'add-transaction',
            Inventory: 'inventory',
            QRPayment: 'qr-payment',
            Reports: 'reports',
            AddContact: 'add-contact',
            ContactDetail: 'contact/:id',
            Notifications: 'notifications',
            Predictions: 'predictions',
        },
    },
};

export const RootNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, setLoading } = useAuthStore();

    // Initialize auth state on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Start background sync when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            backgroundSync.initialize().then(() => {
                backgroundSync.startPeriodicSync();
                // Trigger initial sync after 2 seconds
                setTimeout(() => backgroundSync.triggerSync(), 2000);
            });
        } else {
            backgroundSync.stopPeriodicSync();
        }
        return () => backgroundSync.stopPeriodicSync();
    }, [isAuthenticated]);

    // Show loading screen while checking auth state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <AbilityProvider>
            <NavigationContainer linking={linking as any}>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {isAuthenticated ? (
                        <>
                            <Stack.Screen name="Main" component={MainTabs} />
                            <Stack.Screen
                                name="AddTransaction"
                                component={AddTransactionScreen}
                                options={{ presentation: 'modal' as any }}
                            />
                            <Stack.Screen
                                name="Inventory"
                                component={InventoryScreen}
                            />
                            <Stack.Screen
                                name="QRPayment"
                                component={QRPaymentScreen}
                                options={{ presentation: 'modal' as any }}
                            />
                            <Stack.Screen
                                name="Reports"
                                component={ReportsScreen}
                            />
                            <Stack.Screen
                                name="AddContact"
                                component={AddContactScreen}
                                options={{ presentation: 'modal' as any }}
                            />
                            <Stack.Screen
                                name="ContactDetail"
                                component={ContactDetailScreen}
                            />
                            <Stack.Screen
                                name="Notifications"
                                component={NotificationsScreen}
                            />
                            <Stack.Screen
                                name="Predictions"
                                component={PredictionsScreen}
                            />
                            <Stack.Screen
                                name="ChatBot"
                                component={ChatBotScreen}
                            />
                        </>
                    ) : (
                        <Stack.Screen name="Auth" component={AuthStack} />
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </AbilityProvider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});

