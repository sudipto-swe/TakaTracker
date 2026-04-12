/**
 * SmartDropdown - Reusable searchable dropdown component.
 * Features: search/filter, recent items, custom "add new" option, icons per item.
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    StyleSheet,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';

export interface DropdownOption {
    label: string;
    value: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    subtitle?: string;
}

interface SmartDropdownProps {
    label?: string;
    placeholder?: string;
    options: DropdownOption[];
    selectedValue?: string;
    onSelect: (option: DropdownOption) => void;
    allowCustom?: boolean;
    customLabel?: string;
    onCustom?: (text: string) => void;
    recentValues?: string[];
    icon?: keyof typeof Ionicons.glyphMap;
    disabled?: boolean;
    error?: string;
}

export const SmartDropdown: React.FC<SmartDropdownProps> = ({
    label,
    placeholder = t('dropdown.select'),
    options,
    selectedValue,
    onSelect,
    allowCustom = false,
    customLabel = t('dropdown.addNew'),
    onCustom,
    recentValues = [],
    icon,
    disabled = false,
    error,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customText, setCustomText] = useState('');

    const selectedOption = options.find(o => o.value === selectedValue);

    // Sort: recent items first, then alphabetical
    const sortedOptions = useMemo(() => {
        const filtered = options.filter(o =>
            o.label.toLowerCase().includes(searchText.toLowerCase()) ||
            o.value.toLowerCase().includes(searchText.toLowerCase()) ||
            (o.subtitle && o.subtitle.toLowerCase().includes(searchText.toLowerCase()))
        );

        if (recentValues.length === 0) return filtered;

        const recent = filtered.filter(o => recentValues.includes(o.value));
        const rest = filtered.filter(o => !recentValues.includes(o.value));
        return [...recent, ...rest];
    }, [options, searchText, recentValues]);

    const handleSelect = (option: DropdownOption) => {
        onSelect(option);
        setIsOpen(false);
        setSearchText('');
        setIsCustomMode(false);
    };

    const handleCustomSubmit = () => {
        if (customText.trim()) {
            if (onCustom) {
                onCustom(customText.trim());
            } else {
                onSelect({ label: customText.trim(), value: customText.trim() });
            }
            setCustomText('');
            setIsCustomMode(false);
            setIsOpen(false);
            setSearchText('');
        }
    };

    const openDropdown = () => {
        if (!disabled) {
            setIsOpen(true);
            setIsCustomMode(false);
            setCustomText('');
            setSearchText('');
        }
    };

    return (
        <View>
            {label && <Text style={styles.label}>{label}</Text>}

            {/* Trigger Button */}
            <TouchableOpacity
                style={[
                    styles.trigger,
                    disabled && styles.triggerDisabled,
                    error ? styles.triggerError : null,
                ]}
                onPress={openDropdown}
                activeOpacity={0.7}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={selectedOption ? COLORS.primary : COLORS.gray400}
                        style={{ marginRight: SPACING.sm }}
                    />
                )}
                {selectedOption?.icon && (
                    <Ionicons
                        name={selectedOption.icon}
                        size={18}
                        color={selectedOption.iconColor || COLORS.primary}
                        style={{ marginRight: SPACING.sm }}
                    />
                )}
                <View style={{ flex: 1 }}>
                    <Text
                        style={[
                            styles.triggerText,
                            !selectedOption && styles.triggerPlaceholder,
                        ]}
                        numberOfLines={1}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </Text>
                    {selectedOption?.subtitle && (
                        <Text style={styles.triggerSubtitle} numberOfLines={1}>
                            {selectedOption.subtitle}
                        </Text>
                    )}
                </View>
                <Ionicons name="chevron-down" size={18} color={COLORS.gray400} />
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Dropdown Modal */}
            <Modal visible={isOpen} animationType="slide" transparent>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => { setIsOpen(false); Keyboard.dismiss(); }}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {label || placeholder}
                            </Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchRow}>
                            <Ionicons name="search" size={18} color={COLORS.gray400} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('dropdown.search')}
                                placeholderTextColor={COLORS.gray400}
                                value={searchText}
                                onChangeText={setSearchText}
                                autoFocus
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')}>
                                    <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Custom input mode */}
                        {isCustomMode ? (
                            <View style={styles.customInputContainer}>
                                <TextInput
                                    style={styles.customInput}
                                    placeholder={t('dropdown.addNewValue')}
                                    placeholderTextColor={COLORS.gray400}
                                    value={customText}
                                    onChangeText={setCustomText}
                                    autoFocus
                                />
                                <View style={styles.customActions}>
                                    <TouchableOpacity
                                        style={styles.customCancelBtn}
                                        onPress={() => setIsCustomMode(false)}
                                    >
                                        <Text style={styles.customCancelText}>{t('common.cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.customSaveBtn,
                                            !customText.trim() && { opacity: 0.5 },
                                        ]}
                                        onPress={handleCustomSubmit}
                                        disabled={!customText.trim()}
                                    >
                                        <Ionicons name="checkmark" size={18} color={COLORS.white} />
                                        <Text style={styles.customSaveText}>{t('voice.addNew')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>
                                {/* Recent label */}
                                {recentValues.length > 0 && searchText === '' && (
                                    <Text style={styles.recentLabel}>{t('dropdown.recentlyUsed')}</Text>
                                )}

                                {/* Options list */}
                                <FlatList
                                    data={sortedOptions}
                                    keyExtractor={(item, idx) => `${item.value}-${idx}`}
                                    style={{ maxHeight: 350 }}
                                    keyboardShouldPersistTaps="handled"
                                    renderItem={({ item, index }) => {
                                        const isRecent = recentValues.includes(item.value) && searchText === '';
                                        const isSelected = item.value === selectedValue;
                                        const showRecentDivider = isRecent &&
                                            index === recentValues.filter(rv => options.some(o => o.value === rv)).length - 1;

                                        return (
                                            <>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.optionItem,
                                                        isSelected && styles.optionItemSelected,
                                                    ]}
                                                    onPress={() => handleSelect(item)}
                                                >
                                                    {item.icon && (
                                                        <Ionicons
                                                            name={item.icon}
                                                            size={20}
                                                            color={item.iconColor || COLORS.primary}
                                                            style={{ marginRight: SPACING.sm }}
                                                        />
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[
                                                            styles.optionLabel,
                                                            isSelected && styles.optionLabelSelected,
                                                        ]}>
                                                            {item.label}
                                                        </Text>
                                                        {item.subtitle && (
                                                            <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                                                        )}
                                                    </View>
                                                    {isRecent && (
                                                        <Ionicons name="time-outline" size={14} color={COLORS.gray400} />
                                                    )}
                                                    {isSelected && (
                                                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                                    )}
                                                </TouchableOpacity>
                                                {showRecentDivider && <View style={styles.divider} />}
                                            </>
                                        );
                                    }}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="search-outline" size={32} color={COLORS.gray300} />
                                            <Text style={styles.emptyText}>{t('dropdown.nothingFound')}</Text>
                                        </View>
                                    }
                                />

                                {/* Add custom option */}
                                {allowCustom && (
                                    <TouchableOpacity
                                        style={styles.addCustomBtn}
                                        onPress={() => {
                                            setCustomText(searchText);
                                            setIsCustomMode(true);
                                        }}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                                        <Text style={styles.addCustomText}>{customLabel}</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    triggerDisabled: {
        opacity: 0.5,
    },
    triggerError: {
        borderColor: COLORS.error,
    },
    triggerText: {
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    triggerPlaceholder: {
        color: COLORS.gray400,
        fontWeight: '400',
    },
    triggerSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    errorText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        paddingBottom: SPACING['3xl'],
        maxHeight: '75%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
    },
    recentLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    optionItemSelected: {
        backgroundColor: COLORS.primary + '08',
    },
    optionLabel: {
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
    },
    optionLabelSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
    optionSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray200,
        marginVertical: SPACING.xs,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.sm,
    },
    addCustomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        gap: SPACING.sm,
        marginTop: SPACING.xs,
    },
    addCustomText: {
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
        fontWeight: '600',
    },
    customInputContainer: {
        padding: SPACING.md,
    },
    customInput: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
        marginBottom: SPACING.md,
    },
    customActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
    },
    customCancelBtn: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.gray300,
    },
    customCancelText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    customSaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary,
        gap: SPACING.xs,
    },
    customSaveText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.white,
        fontWeight: '600',
    },
});
