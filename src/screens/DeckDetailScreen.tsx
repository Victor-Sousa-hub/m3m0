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
import type { Theme } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import type { AttemptRecord } from '../data/attemptRecord';

type Props = NativeStackScreenProps<RootStackParamList, 'DeckDetail'>;

export default function DeckDetailScreen({ route, navigation }: Props) {
  const { deckId, deckName, deckKind } = route.params;
  const user = useCurrentUser();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
        onPress={() => navigation.navigate('Preparation', { deckId, deckName, deckKind })}
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
              {GAME_MODES[item.gameMode].label} · {item.score}/{item.totalQuestions} · {item.points} pts
              {!GAME_MODES[item.gameMode].untimed && ` · ${item.durationMinutes} min`}
            </Text>
            <Text style={styles.attemptDate}>{item.completedAt}</Text>
          </View>
        )}
      />
    </View>
  );
}

function createStyles({ colors, spacing, radius, typography }: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    title: {
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginBottom: spacing.unit,
    },
    subtitle: {
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      fontFamily: typography.fontFamily.regular,
    },
    startButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      color: colors.textOnAccent,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.md,
    },
    historyTitle: {
      fontSize: typography.size.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    recordsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    recordCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      minWidth: 84,
    },
    recordDuration: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
    },
    recordPoints: {
      fontSize: typography.size.sm,
      color: colors.accent,
      fontFamily: typography.fontFamily.bold,
      marginTop: spacing.unit,
    },
    recordScore: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      marginTop: spacing.unit,
      fontFamily: typography.fontFamily.regular,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
    attemptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    attemptScore: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
    },
    attemptDate: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
  });
}
