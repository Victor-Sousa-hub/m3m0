import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getQuestionCountForDeck } from '../db/questions';
import { getAttemptsForDeck } from '../db/scores';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import type { QuizAttempt } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'DeckDetail'>;

export default function DeckDetailScreen({ route, navigation }: Props) {
  const { deckId, deckName } = route.params;
  const user = useCurrentUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        onPress={() => navigation.navigate('Preparation', { deckId, deckName })}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      color: colors.textMuted,
      marginBottom: 16,
    },
    startButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 24,
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      color: colors.primaryText,
      fontWeight: '600',
      fontSize: 16,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      color: colors.textMuted,
    },
    attemptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    attemptScore: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    attemptDate: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
}
