/**
 * Screen header component used across all screens.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    leftAction?: React.ReactNode;
    transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    showBack = false,
    rightAction,
    leftAction,
    transparent = false,
}) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <>
            <StatusBar
                barStyle={transparent ? 'light-content' : 'dark-content'}
                backgroundColor={transparent ? 'transparent' : COLORS.surface}
            />
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top + SPACING.sm },
                    !transparent && SHADOWS.sm,
                    transparent && styles.transparent,
                ]}
            >
                <View style={styles.leftContainer}>
                    {showBack && (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Text style={styles.backIcon}>←</Text>
                        </TouchableOpacity>
                    )}
                    {leftAction && !showBack && leftAction}
                </View>

                <View style={styles.titleContainer}>
                    <Text style={[styles.title, transparent && styles.titleLight]} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={[styles.subtitle, transparent && styles.subtitleLight]}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                <View style={styles.rightContainer}>{rightAction}</View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.surface,
    },
    transparent: {
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    leftContainer: {
        width: 50,
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    rightContainer: {
        width: 50,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    titleLight: {
        color: COLORS.white,
    },
    subtitle: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    subtitleLight: {
        color: 'rgba(255,255,255,0.8)',
    },
    backButton: {
        padding: SPACING.xs,
    },
    backIcon: {
        fontSize: FONT_SIZES['2xl'],
        color: COLORS.textPrimary,
    },
});

export default Header;
