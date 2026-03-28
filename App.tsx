/**
 * TakaTracker - Main App Entry
 * Digital bookkeeping app for Bangladesh merchants
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { LanguageProvider } from './src/i18n/LanguageContext';

// Conditionally import GestureHandler for native only
const GestureWrapper = Platform.OS === 'web'
  ? ({ children, style }: { children: React.ReactNode; style?: any }) => <View style={style}>{children}</View>
  : require('react-native-gesture-handler').GestureHandlerRootView;

export default function App() {
  return (
    <GestureWrapper style={styles.container}>
      <SafeAreaProvider>
        <LanguageProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
