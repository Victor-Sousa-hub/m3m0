import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as attemptRepository from '../data/attemptRepository';
import * as streakRepository from '../data/streakRepository';
import { GAME_MODE_ORDER, GAME_MODES, type GameMode } from '../quiz/gameModes';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../theme/useTheme';
import StreakFlame from '../components/StreakFlame';
import type { Theme } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import type { AttemptRecord } from '../data/attemptRecord';
import type { StreakInfo } from '../sync/streakMath';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [scoreboardFilter, setScoreboardFilter] = useState<GameMode | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([attemptRepository.getAllAttempts(user.id), streakRepository.getStreak(user.id)])
        .then(([allAttempts, streakInfo]) => {
          if (cancelled) return;
          setAttempts(allAttempts);
          setStreak(streakInfo);
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
    return [...filtered].sort((a, b) => b.points - a.points);
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
          <View style={styles.streakValueRow}>
            <StreakFlame
              streak={{ freezesAvailable: streak?.freezesAvailable ?? 0, isFrozenToday: streak?.isFrozenToday ?? false }}
            />
            <Text style={styles.summaryValue}>{streak?.currentStreak ?? 0}</Text>
          </View>
          <Text style={styles.summaryLabel}>
            Sequência atual{streak?.isFrozenToday ? ' (congelada)' : ''}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>🏆 {streak?.longestStreak ?? 0}</Text>
          <Text style={styles.summaryLabel}>Recorde de sequência</Text>
        </View>
      </View>

      <FlatList
        data={scoreboard}
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
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma partida ainda.</Text>}
        renderItem={({ item, index }) => (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreRank}>#{index + 1}</Text>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreDeck}>{item.deckName}</Text>
              <Text style={styles.scoreMeta}>
                {GAME_MODES[item.gameMode].label} · {item.score}/{item.totalQuestions}
                {!GAME_MODES[item.gameMode].untimed && ` · ${item.durationMinutes} min`} ·{' '}
                {formatDate(item.completedAt)}
              </Text>
            </View>
            <Text style={styles.scorePoints}>{item.points} pts</Text>
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
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    summaryCard: {
      flexBasis: '47%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    summaryValue: {
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.accent,
    },
    streakValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    summaryLabel: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      marginTop: spacing.unit,
      fontFamily: typography.fontFamily.regular,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    filterChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    filterChipSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    filterChipText: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
    },
    filterChipTextSelected: {
      color: colors.accent,
    },
    sectionTitle: {
      fontSize: typography.size.md,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      marginTop: spacing.unit,
    },
    emptyText: {
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      fontFamily: typography.fontFamily.regular,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    scoreRank: {
      width: 28,
      fontFamily: typography.fontFamily.bold,
      color: colors.textSecondary,
    },
    scoreInfo: {
      flex: 1,
    },
    scoreDeck: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
    },
    scoreMeta: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      marginTop: spacing.unit,
      fontFamily: typography.fontFamily.regular,
    },
    scorePoints: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
      color: colors.accent,
    },
  });
}
