import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { getSyncState } from './src/db/syncState';
import { UserProvider } from './src/context/UserContext';
import { useTheme } from './src/theme/useTheme';
import RootNavigator from './src/navigation/RootNavigator';
import SyncScreen from './src/screens/SyncScreen';
import type { User } from './src/types/models';

/**
 * The web build has no local database or per-device profile — identity is
 * the paired sync account, not a `users` row — so every screen that reads
 * `useCurrentUser()` gets this fixed placeholder. Its `id` is never used to
 * scope backend data (the sync_secret does that); it only satisfies the
 * shared screen code that still expects a userId parameter.
 */
const WEB_USER: User = {
  id: 1,
  name: 'Você',
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  createdAt: new Date(0).toISOString(),
};

export default function App() {
  const [isPaired, setIsPaired] = useState<boolean | null>(null);
  const { colors, isDark } = useTheme();

  const checkPairing = useCallback(() => {
    getSyncState().then((state) => setIsPaired(!!state));
  }, []);

  useEffect(() => {
    checkPairing();
  }, [checkPairing]);

  if (isPaired === null) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isPaired) {
    return (
      <SafeAreaProvider>
        <SyncScreen onPaired={checkPairing} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider value={WEB_USER}>
        <RootNavigator />
      </UserProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
