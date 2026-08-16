import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DecksScreen from '../screens/DecksScreen';
import DeckDetailScreen from '../screens/DeckDetailScreen';
import QuizScreen from '../screens/QuizScreen';
import ResultsScreen from '../screens/ResultsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Decks">
        <Stack.Screen name="Decks" component={DecksScreen} options={{ title: 'm3m0' }} />
        <Stack.Screen
          name="DeckDetail"
          component={DeckDetailScreen}
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
