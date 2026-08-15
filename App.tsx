import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { getDatabase } from './src/db/database';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    getDatabase().then(() => setIsDbReady(true));
  }, []);

  if (!isDbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="auto" />
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
