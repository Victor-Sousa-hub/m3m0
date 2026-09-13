import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/tokens';
import type { StreakInfo } from '../sync/streakMath';
import { MAX_BANKED_FREEZES } from '../sync/streakMath';

type Size = 'compact' | 'large';

type Props = {
  streak: Pick<StreakInfo, 'freezesAvailable' | 'isFrozenToday'>;
  size?: Size;
};

const FLAME_SIZES: Record<Size, [number, number, number, number]> = {
  // [no freezes, 1 banked, 2 banked, 3 banked]
  compact: [16, 20, 24, 28],
  large: [22, 28, 34, 40],
};

const GLOW_SIZES: Record<Size, [number, number, number, number]> = {
  compact: [0, 28, 34, 40],
  large: [0, 40, 48, 56],
};

const ICE_SIZE: Record<Size, number> = { compact: 11, large: 14 };

/**
 * The flame icon that stands in for "🔥 {n}" wherever the streak is shown.
 * Deliberately built from emoji + sizing/opacity instead of custom art —
 * matches the plain-emoji look already used for streaks, needs no new
 * dependency or asset pipeline. Intensity (size + glow) scales with banked
 * freezes; a frozen (auto-covered) streak swaps the flame for an ice cube.
 */
export default function StreakFlame({ streak, size = 'compact' }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const tier = Math.min(streak.freezesAvailable, MAX_BANKED_FREEZES) as 0 | 1 | 2 | 3;
  const flameSize = FLAME_SIZES[size][tier];
  const glowSize = GLOW_SIZES[size][tier];

  if (streak.isFrozenToday) {
    return (
      <View style={styles.row}>
        <View style={[styles.glow, styles.frozenGlow, { width: glowSize || flameSize + 8, height: glowSize || flameSize + 8, borderRadius: (glowSize || flameSize + 8) / 2 }]}>
          <Text style={{ fontSize: flameSize }}>❄️</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {glowSize > 0 ? (
        <View
          style={[
            styles.glow,
            styles.fireGlow,
            { width: glowSize, height: glowSize, borderRadius: glowSize / 2 },
          ]}
        >
          <Text style={{ fontSize: flameSize }}>🔥</Text>
        </View>
      ) : (
        <Text style={[styles.weakFlame, { fontSize: flameSize }]}>🔥</Text>
      )}
      {tier > 0 && (
        <View style={styles.iceRow}>
          {Array.from({ length: tier }).map((_, i) => (
            <Text key={i} style={{ fontSize: ICE_SIZE[size] }}>
              🧊
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles({ colors, spacing, elevation }: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.unit,
    },
    weakFlame: {
      opacity: 0.45,
    },
    glow: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    fireGlow: {
      backgroundColor: colors.accentMuted,
    },
    frozenGlow: {
      backgroundColor: colors.backgroundElevated,
      ...elevation.card,
    },
    iceRow: {
      flexDirection: 'row',
      gap: 1,
    },
  });
}
