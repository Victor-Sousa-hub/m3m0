import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { getDatabase } from './src/db/database';
import { importSeedQuestionSets } from './src/db/importSeedData';
import { getCurrentUser } from './src/db/users';
import { UserProvider } from './src/context/UserContext';
import { useTheme } from './src/theme/useTheme';
import RootNavigator from './src/navigation/RootNavigator';
import CreateProfileScreen from './src/screens/CreateProfileScreen';
import type { User } from './src/types/models';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    getDatabase()
      .then(async (db) => {
        await importSeedQuestionSets(db);
        return getCurrentUser();
      })
      .then((existingUser) => {
        setUser(existingUser);
        setIsDbReady(true);
      });
  }, []);

  const handleProfileCreated = useCallback((createdUser: User) => {
    setUser(createdUser);
  }, []);

  if (!isDbReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <CreateProfileScreen onProfileCreated={handleProfileCreated} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider value={user}>
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
