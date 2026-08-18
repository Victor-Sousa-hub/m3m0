import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as deckRepository from '../data/deckRepository';
import * as attemptRepository from '../data/attemptRepository';
import { bestAttemptPerMode } from '../data/attemptRecord';
import { GAME_MODES } from '../quiz/gameModes';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import type { AttemptRecord } from '../data/attemptRecord';

type Props = NativeStackScreenProps<RootStackParamList, 'DeckDetail'>;

export default function DeckDetailScreen({ route, navigation }: Props) {
  const { deckId, deckName } = route.params;
  const user = useCurrentUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      deckRepository.getQuestionCountForDeck(deckId).then(setQuestionCount);
      attemptRepository.getAttemptsForDeck(user.id, deckId, deckName).then(setAttempts);
    }, [deckId, deckName, user.id])
  );

  const hasQuestions = (questionCount ?? 0) > 0;
  const bestByMode = useMemo(() => bestAttemptPerMode(attempts), [attempts]);

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
        <Text style={styles.startButtonText}>Iniciar partida</Text>
      </Pressable>

      {bestByMode.length > 0 && (
        <>
          <Text style={styles.historyTitle}>Recordes por estilo</Text>
          <View style={styles.recordsRow}>
            {bestByMode.map((attempt) => (
              <View key={attempt.gameMode} style={styles.recordCard}>
                <Text style={styles.recordDuration}>{GAME_MODES[attempt.gameMode].label}</Text>
                <Text style={styles.recordPoints}>{attempt.points} pts</Text>
                <Text style={styles.recordScore}>
                  {attempt.score}/{attempt.totalQuestions}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.historyTitle}>Suas pontuações</Text>
      <FlatList
        data={attempts}
        keyExtractor={(item, index) => item.clientId ?? `${item.completedAt}-${index}`}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma partida feita ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.attemptRow}>
            <Text style={styles.attemptScore}>
              {GAME_MODES[item.gameMode].label} · {item.score}/{item.totalQuestions} · {item.points} pts ·{' '}
              {item.durationMinutes} min
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
    recordsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    recordCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center',
      minWidth: 84,
    },
    recordDuration: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    recordPoints: {
      fontSize: 17,
      color: colors.primary,
      fontWeight: '800',
      marginTop: 2,
    },
    recordScore: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
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
