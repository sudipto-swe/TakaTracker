/**
 * Settings store for smart features toggles.
 * Manages voice mode, conversation tracking, and prediction prefs.
 * Persists to AsyncStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    // Voice features
    voiceModeEnabled: boolean;
    conversationTrackingEnabled: boolean;
    voiceLanguage: 'bn' | 'en' | 'auto';

    // Prediction features
    showPredictions: boolean;
    showComboOffers: boolean;

    // Recent selections (for smart dropdowns)
    recentUnits: string[];
    recentCategories: string[];
    recentPaymentMethods: string[];

    // Actions
    setVoiceMode: (enabled: boolean) => void;
    setConversationTracking: (enabled: boolean) => void;
    setVoiceLanguage: (lang: 'bn' | 'en' | 'auto') => void;
    setShowPredictions: (enabled: boolean) => void;
    setShowComboOffers: (enabled: boolean) => void;
    addRecentUnit: (unit: string) => void;
    addRecentCategory: (category: string) => void;
    addRecentPaymentMethod: (method: string) => void;
}

const MAX_RECENT = 5;

const addToRecent = (list: string[], item: string): string[] => {
    const filtered = list.filter(i => i !== item);
    return [item, ...filtered].slice(0, MAX_RECENT);
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            voiceModeEnabled: true,
            conversationTrackingEnabled: true,
            voiceLanguage: 'bn',
            showPredictions: true,
            showComboOffers: true,
            recentUnits: [],
            recentCategories: [],
            recentPaymentMethods: [],

            setVoiceMode: (enabled) => set({ voiceModeEnabled: enabled }),
            setConversationTracking: (enabled) => set({ conversationTrackingEnabled: enabled }),
            setVoiceLanguage: (lang) => set({ voiceLanguage: lang }),
            setShowPredictions: (enabled) => set({ showPredictions: enabled }),
            setShowComboOffers: (enabled) => set({ showComboOffers: enabled }),

            addRecentUnit: (unit) => set({ recentUnits: addToRecent(get().recentUnits, unit) }),
            addRecentCategory: (category) => set({ recentCategories: addToRecent(get().recentCategories, category) }),
            addRecentPaymentMethod: (method) => set({ recentPaymentMethods: addToRecent(get().recentPaymentMethods, method) }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
