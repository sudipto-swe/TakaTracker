/**
 * Language context for managing app-wide language state.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { setLanguage, getLanguage } from './index';
import { STORAGE_KEYS } from '../constants/config';

type Language = 'bn' | 'en';

interface LanguageContextType {
    language: Language;
    changeLanguage: (lang: Language) => Promise<void>;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLang] = useState<Language>('bn');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
            if (savedLang && (savedLang === 'bn' || savedLang === 'en')) {
                setLang(savedLang);
                setLanguage(savedLang);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const changeLanguage = async (lang: Language) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
            setLang(lang);
            setLanguage(lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
