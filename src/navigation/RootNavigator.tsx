import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DecksScreen from '../screens/DecksScreen';
import DeckDetailScreen from '../screens/DeckDetailScreen';
import PreparationScreen from '../screens/PreparationScreen';
import QuizScreen from '../screens/QuizScreen';
import ResultsScreen from '../screens/ResultsScreen';
import StatsScreen from '../screens/StatsScreen';
import SyncScreen from '../screens/SyncScreen';
import { useTheme } from '../theme/useTheme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors, typography } = useTheme();

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.border,
    },
    fonts: {
      regular: { fontFamily: typography.fontFamily.regular, fontWeight: '400' as const },
      medium: { fontFamily: typography.fontFamily.medium, fontWeight: '500' as const },
      bold: { fontFamily: typography.fontFamily.bold, fontWeight: '700' as const },
      heavy: { fontFamily: typography.fontFamily.bold, fontWeight: '700' as const },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Decks">
        <Stack.Screen name="Decks" component={DecksScreen} options={{ title: 'm3m0' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Estatísticas' }} />
        <Stack.Screen name="Sync" component={SyncScreen} options={{ title: 'Sincronização' }} />
        <Stack.Screen
          name="DeckDetail"
          component={DeckDetailScreen}
          options={({ route }) => ({ title: route.params.deckName })}
        />
        <Stack.Screen
          name="Preparation"
          component={PreparationScreen}
          options={({ route }) => ({ title: route.params.deckName })}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
          options={({ route }) => ({ title: route.params.deckName })}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ title: 'Resultado', headerBackVisible: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
