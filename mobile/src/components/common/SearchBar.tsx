/**
 * Search bar component for filtering lists.
 */
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import { t } from '../../i18n';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
    testID?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder,
    onClear,
    testID,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder || t('common.search')}
                placeholderTextColor={COLORS.gray500}
                testID={testID}
            />
            {value.length > 0 && (
                <TouchableOpacity
                    onPress={() => {
                        onChangeText('');
                        onClear?.();
                    }}
                    style={styles.clearButton}
                >
                    <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        marginHorizontal: SPACING.base,
        marginVertical: SPACING.sm,
    },
    searchIcon: {
        fontSize: FONT_SIZES.md,
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
    },
    clearButton: {
        padding: SPACING.xs,
    },
    clearIcon: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
});

export default SearchBar;
