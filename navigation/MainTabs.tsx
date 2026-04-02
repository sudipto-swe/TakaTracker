/**
 * Main Tab Navigator with bottom tabs.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TransactionsScreen } from '../screens/transactions/TransactionsScreen';
import { ContactsScreen } from '../screens/contacts/ContactsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { AddTransactionScreen } from '../screens/transactions/AddTransactionScreen';
import { MainTabParamList } from './types';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';
import { t } from '../i18n';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom Add Button Component
const AddButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
    <TouchableOpacity style={styles.addButton} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color={COLORS.white} />
    </TouchableOpacity>
);

export const MainTabs: React.FC = () => {
    const insets = useSafeAreaInsets();
    // Use the system's bottom inset (for gesture bar / nav buttons)
    // Minimum of 4px so there's always a tiny gap
    const bottomInset = Math.max(insets.bottom, 4);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray500,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.gray200,
                    height: 56 + bottomInset,
                    paddingBottom: bottomInset,
                    paddingTop: 6,
                },
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Transactions':
                            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
                            break;
                        case 'Contacts':
                            iconName = focused ? 'people' : 'people-outline';
                            break;
                        case 'More':
                            iconName = focused ? 'menu' : 'menu-outline';
                            break;
                    }

                    return <Ionicons name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{ tabBarLabel: 'হোম' }}
            />
            <Tab.Screen
                name="Transactions"
                component={TransactionsScreen}
                options={{ tabBarLabel: 'লেনদেন' }}
            />
            <Tab.Screen
                name="Add"
                component={AddTransactionScreen}
                options={{
                    tabBarLabel: '',
                    tabBarButton: (props) => <AddButton onPress={() => props.onPress?.(undefined as any)} />,
                }}
            />
            <Tab.Screen
                name="Contacts"
                component={ContactsScreen}
                options={{ tabBarLabel: 'যোগাযোগ' }}
            />
            <Tab.Screen
                name="More"
                component={MoreScreen}
                options={{ tabBarLabel: 'আরো' }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarLabel: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '500',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

