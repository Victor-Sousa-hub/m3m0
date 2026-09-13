import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GAME_MODES } from '../quiz/gameModes';
import { useTheme } from '../theme/useTheme';
import StreakFlame from '../components/StreakFlame';
import type { Theme } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ route, navigation }: Props) {
  const {
    deckName,
    gameMode,
    score,
    total,
    points,
    durationMinutes,
    currentStreak,
    longestStreak,
    isNewStreakDay,
    freezesAvailable,
    isFrozenToday,
  } = route.params;
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const isStreakRecord = isNewStreakDay && currentStreak > 1 && currentStreak === longestStreak;

  return (
    <View style={styles.container}>
      <Text style={styles.deckName}>{deckName}</Text>
      <Text style={styles.percentage}>{percentage}%</Text>
      <Text style={styles.scoreText}>
        {score} de {total} perguntas corretas
      </Text>
      <Text style={styles.pointsText}>
        {points} pts (pontuação final) · {GAME_MODES[gameMode].label}
        {!GAME_MODES[gameMode].untimed && ` · ${durationMinutes} min`}
      </Text>

      <View style={styles.streakBadge}>
        <View style={styles.streakRow}>
          <StreakFlame streak={{ freezesAvailable, isFrozenToday }} size="large" />
          <Text style={styles.streakText}>
            Sequência de {currentStreak} dia{currentStreak === 1 ? '' : 's'}
          </Text>
        </View>
        {isFrozenToday && <Text style={styles.streakFrozenText}>Streak congelada — jogue hoje para manter!</Text>}
        {isStreakRecord && <Text style={styles.streakRecordText}>Novo recorde pessoal!</Text>}
      </View>

      <Pressable style={styles.button} onPress={() => navigation.popToTop()}>
        <Text style={styles.buttonText}>Voltar aos baralhos</Text>
      </Pressable>
    </View>
  );
}

function createStyles({ colors, spacing, radius, typography }: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    deckName: {
      fontSize: typography.size.md,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      fontFamily: typography.fontFamily.regular,
    },
    percentage: {
      // The one intentional display-size outlier — no token step covers a
      // hero result number, so it's derived from the scale rather than a
      // raw literal.
      fontSize: typography.size.xl * 2,
      fontFamily: typography.fontFamily.bold,
      color: colors.accent,
    },
    scoreText: {
      fontSize: typography.size.md,
      color: colors.textPrimary,
      marginTop: spacing.sm,
      fontFamily: typography.fontFamily.regular,
    },
    pointsText: {
      fontSize: typography.size.sm,
      color: colors.textSecondary,
      marginTop: spacing.unit,
      marginBottom: spacing.xl,
      fontFamily: typography.fontFamily.regular,
    },
    streakBadge: {
      backgroundColor: colors.accentMuted,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    streakText: {
      fontSize: typography.size.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.accent,
    },
    streakFrozenText: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      fontFamily: typography.fontFamily.regular,
    },
    streakRecordText: {
      fontSize: typography.size.xs,
      color: colors.correct,
      fontFamily: typography.fontFamily.medium,
      marginTop: spacing.unit,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    buttonText: {
      color: colors.textOnAccent,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.md,
    },
  });
}
