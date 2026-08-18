import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as attemptRepository from '../data/attemptRepository';
import * as streakRepository from '../data/streakRepository';
import { GAME_MODE_ORDER, GAME_MODES, type GameMode } from '../quiz/gameModes';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import type { AttemptRecord } from '../data/attemptRecord';
import type { StreakInfo } from '../sync/streakMath';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

const SCOREBOARD_SIZE = 10;

function formatHours(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes}min`;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function StatsScreen({}: Props) {
  const user = useCurrentUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreboardFilter, setScoreboardFilter] = useState<GameMode | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      Promise.all([attemptRepository.getAllAttempts(user.id), streakRepository.getStreak(user.id)])
        .then(([allAttempts, streakInfo]) => {
          if (cancelled) return;
          setAttempts(allAttempts);
          setStreak(streakInfo);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [user.id])
  );

  const totalSeconds = useMemo(
    () => attempts.reduce((sum, attempt) => sum + attempt.timeTakenSeconds, 0),
    [attempts]
  );
  const scoreboard = useMemo(() => {
    const filtered =
      scoreboardFilter === 'all' ? attempts : attempts.filter((a) => a.gameMode === scoreboardFilter);
    return [...filtered].sort((a, b) => b.points - a.points).slice(0, SCOREBOARD_SIZE);
  }, [attempts, scoreboardFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatHours(totalSeconds)}</Text>
          <Text style={styles.summaryLabel}>Horas jogando</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{attempts.length}</Text>
          <Text style={styles.summaryLabel}>Partidas</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>🔥 {streak?.currentStreak ?? 0}</Text>
          <Text style={styles.summaryLabel}>Sequência atual</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>🏆 {streak?.longestStreak ?? 0}</Text>
          <Text style={styles.summaryLabel}>Recorde de sequência</Text>
        </View>
      </View>

      <FlatList
        data={attempts}
        keyExtractor={(item, index) => item.clientId ?? `${item.completedAt}-${index}`}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Scoreboard</Text>
            <View style={styles.filterRow}>
              {(['all', ...GAME_MODE_ORDER] as const).map((filter) => {
                const isSelected = filter === scoreboardFilter;
                const label = filter === 'all' ? 'Todos' : GAME_MODES[filter].label;
                return (
                  <Pressable
                    key={filter}
                    style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                    onPress={() => setScoreboardFilter(filter)}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {scoreboard.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma partida ainda.</Text>
            ) : (
              scoreboard.map((attempt, index) => (
                <View key={attempt.clientId ?? index} style={styles.scoreRow}>
                  <Text style={styles.scoreRank}>#{index + 1}</Text>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreDeck}>{attempt.deckName}</Text>
                    <Text style={styles.scoreMeta}>
                      {GAME_MODES[attempt.gameMode].label} · {attempt.score}/{attempt.totalQuestions} ·{' '}
                      {attempt.durationMinutes} min · {formatDate(attempt.completedAt)}
                    </Text>
                  </View>
                  <Text style={styles.scorePoints}>{attempt.points} pts</Text>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>Histórico</Text>
            {!isLoading && attempts.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma partida feita ainda.</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreDeck}>{item.deckName}</Text>
              <Text style={styles.scoreMeta}>
                {GAME_MODES[item.gameMode].label} · {item.score}/{item.totalQuestions} · {item.points} pts
              </Text>
            </View>
            <Text style={styles.historyDate}>{formatDate(item.completedAt)}</Text>
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
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    summaryCard: {
      flexBasis: '47%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    filterChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    filterChipTextSelected: {
      color: colors.primary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
    },
    emptyText: {
      color: colors.textMuted,
      marginBottom: 16,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    scoreRank: {
      width: 28,
      fontWeight: '700',
      color: colors.textMuted,
    },
    scoreInfo: {
      flex: 1,
    },
    scoreDeck: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    scoreMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    scorePoints: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyDate: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });
}
