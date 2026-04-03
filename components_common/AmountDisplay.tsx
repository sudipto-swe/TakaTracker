/**
 * Amount display component with currency formatting.
 */
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { formatCurrency } from '../../i18n';
import { COLORS, FONT_SIZES } from '../../constants/theme';

interface AmountDisplayProps {
    amount: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'default' | 'success' | 'danger' | 'muted';
    showSign?: boolean;
    style?: TextStyle;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
    amount,
    size = 'md',
    color = 'default',
    showSign = false,
    style,
}) => {
    const getSize = (): number => {
        switch (size) {
            case 'sm':
                return FONT_SIZES.sm;
            case 'lg':
                return FONT_SIZES.xl;
            case 'xl':
                return FONT_SIZES['2xl'];
            default:
                return FONT_SIZES.md;
        }
    };

    const getColor = (): string => {
        switch (color) {
            case 'success':
                return COLORS.receivable;
            case 'danger':
                return COLORS.payable;
            case 'muted':
                return COLORS.textMuted;
            default:
                return COLORS.textPrimary;
        }
    };

    const displayAmount = showSign && amount > 0 ? `+${formatCurrency(amount)}` : formatCurrency(amount);

    return (
        <Text
            style={[
                styles.amount,
                { fontSize: getSize(), color: getColor() },
                style,
            ]}
        >
            {displayAmount}
        </Text>
    );
};

const styles = StyleSheet.create({
    amount: {
        fontWeight: '700',
    },
});

export default AmountDisplay;
