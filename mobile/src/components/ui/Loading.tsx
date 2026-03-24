/**
 * Loading indicator component.
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

interface LoadingProps {
    message?: string;
    size?: 'small' | 'large';
    fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
    message,
    size = 'large',
    fullScreen = false,
}) => {
    return (
        <View style={[styles.container, fullScreen && styles.fullScreen]}>
            <ActivityIndicator size={size} color={COLORS.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    fullScreen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    message: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZES.base,
        color: COLORS.textSecondary,
    },
});

export default Loading;
