import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  FiraCode_400Regular,
  FiraCode_500Medium,
  FiraCode_700Bold,
} from '@expo-google-fonts/fira-code';

import { getSyncState } from './src/db/syncState';
import { UserProvider } from './src/context/UserContext';
import { useTheme } from './src/theme/useTheme';
import RootNavigator from './src/navigation/RootNavigator';
import SyncScreen from './src/screens/SyncScreen';
import GnuEasterEgg from './src/components/GnuEasterEgg';
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
  const { colors } = useTheme();
  const [fontsLoaded] = useFonts({
    'FiraCode-Regular': FiraCode_400Regular,
    'FiraCode-Medium': FiraCode_500Medium,
    'FiraCode-Bold': FiraCode_700Bold,
  });

  const checkPairing = useCallback(() => {
    getSyncState().then((state) => setIsPaired(!!state));
  }, []);

  useEffect(() => {
    checkPairing();
  }, [checkPairing]);

  useEffect(() => {
    // RN Views on web only paint their own box — when a screen's content is
    // taller than the viewport, the overflow shows the browser's default
    // (white) canvas instead of the app background. Match html/body to it.
    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
  }, [colors.background]);

  if (isPaired === null || !fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <GnuEasterEgg />
      </View>
    );
  }

  if (!isPaired) {
    return (
      <SafeAreaProvider>
        <SyncScreen onPaired={checkPairing} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider value={WEB_USER}>
        <RootNavigator />
      </UserProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
});
