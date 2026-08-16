import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getQuestionCountForDeck } from '../db/questions';
import { getAttemptsForDeck } from '../db/scores';
import { useCurrentUser } from '../context/UserContext';
import type { RootStackParamList } from '../navigation/types';
import type { QuizAttempt } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'DeckDetail'>;

export default function DeckDetailScreen({ route, navigation }: Props) {
  const { deckId, deckName } = route.params;
  const user = useCurrentUser();

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useFocusEffect(
    useCallback(() => {
      getQuestionCountForDeck(deckId).then(setQuestionCount);
      getAttemptsForDeck(user.id, deckId).then(setAttempts);
    }, [deckId, user.id])
  );

  const hasQuestions = (questionCount ?? 0) > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{deckName}</Text>
      <Text style={styles.subtitle}>
        {questionCount === null
          ? 'Carregando...'
          : `${questionCount} pergunta${questionCount === 1 ? '' : 's'}`}
      </Text>

      <Pressable
        style={[styles.startButton, !hasQuestions && styles.startButtonDisabled]}
        onPress={() => navigation.navigate('Quiz', { deckId, deckName })}
        disabled={!hasQuestions}
      >
        <Text style={styles.startButtonText}>Iniciar simulado</Text>
      </Pressable>

      <Text style={styles.historyTitle}>Suas pontuações</Text>
      <FlatList
        data={attempts}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum simulado feito ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.attemptRow}>
            <Text style={styles.attemptScore}>
              {item.score}/{item.totalQuestions}
            </Text>
            <Text style={styles.attemptDate}>{item.completedAt}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#2f6feb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
  },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  attemptScore: {
    fontSize: 15,
    fontWeight: '600',
  },
  attemptDate: {
    fontSize: 13,
    color: '#888',
  },
});
