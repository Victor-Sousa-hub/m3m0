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

import { getDatabase } from './src/db/database';
import { importSeedQuestionSets } from './src/db/importSeedData';
import { getCurrentUser } from './src/db/users';
import { syncNow } from './src/sync/syncClient';
import { UserProvider } from './src/context/UserContext';
import { useTheme } from './src/theme/useTheme';
import RootNavigator from './src/navigation/RootNavigator';
import CreateProfileScreen from './src/screens/CreateProfileScreen';
import GnuEasterEgg from './src/components/GnuEasterEgg';
import type { User } from './src/types/models';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { colors } = useTheme();
  const [fontsLoaded] = useFonts({
    'FiraCode-Regular': FiraCode_400Regular,
    'FiraCode-Medium': FiraCode_500Medium,
    'FiraCode-Bold': FiraCode_700Bold,
  });

  useEffect(() => {
    getDatabase()
      .then(async () => {
        await importSeedQuestionSets();
        return getCurrentUser();
      })
      .then((existingUser) => {
        setUser(existingUser);
        setIsDbReady(true);
        syncNow(); // fire-and-forget — pulls in any streak/freeze progress from other devices
      });
  }, []);

  const handleProfileCreated = useCallback((createdUser: User) => {
    setUser(createdUser);
  }, []);

  if (!isDbReady || !fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <GnuEasterEgg />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <CreateProfileScreen onProfileCreated={handleProfileCreated} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider value={user}>
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
