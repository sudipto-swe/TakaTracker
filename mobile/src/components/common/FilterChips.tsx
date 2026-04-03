/**
 * Filter chip component for filtering lists.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';

interface FilterOption {
    key: string;
    label: string;
}

interface FilterChipsProps {
    options: FilterOption[];
    selected: string;
    onSelect: (key: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
    options,
    selected,
    onSelect,
}) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {options.map((option) => (
                <TouchableOpacity
                    key={option.key}
                    onPress={() => onSelect(option.key)}
                    style={[
                        styles.chip,
                        selected === option.key && styles.chipSelected,
                    ]}
                >
                    <Text
                        style={[
                            styles.chipText,
                            selected === option.key && styles.chipTextSelected,
                        ]}
                    >
                        {option.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: SPACING.sm,
    },
    content: {
        paddingHorizontal: SPACING.base,
        gap: SPACING.sm,
    },
    chip: {
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray100,
        marginRight: SPACING.sm,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
    },
    chipText: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    chipTextSelected: {
        color: COLORS.white,
    },
});

export default FilterChips;
