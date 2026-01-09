import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient } from './src/config/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * Root App Component
 * 
 * Setup:
 * - React Query provider for API state management
 * - Navigation container
 * - Safe area context for notch/status bar handling
 * - Gesture handler for swipe gestures
 */

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
