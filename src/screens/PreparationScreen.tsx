import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as deckRepository from '../data/deckRepository';
import {
  ALLOWED_GAME_MODES_BY_DECK_KIND,
  GAME_MODES,
  KEY_CONCEPTS_BLITZ_DURATIONS,
  presetOptions,
  type GameMode,
} from '../quiz/gameModes';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Preparation'>;

export default function PreparationScreen({ route, navigation }: Props) {
  const { deckId, deckName, deckKind } = route.params;
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const allowedModes = ALLOWED_GAME_MODES_BY_DECK_KIND[deckKind];
  const isKeyConcepts = deckKind === 'key_concepts';

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(allowedModes[0]);
  const [selectedQuestions, setSelectedQuestions] = useState(GAME_MODES[allowedModes[0]].minQuestions);
  const [durationMinutes, setDurationMinutes] = useState(
    isKeyConcepts ? KEY_CONCEPTS_BLITZ_DURATIONS[0] : GAME_MODES[allowedModes[0]].minDurationMinutes
  );

  useEffect(() => {
    deckRepository.getQuestionCountForDeck(deckId).then(setQuestionCount);
  }, [deckId]);

  const mode = GAME_MODES[gameMode];
  const deckTotal = questionCount ?? 0;

  // Bounds clamped to what the deck actually has available.
  const effectiveMaxQuestions = Math.min(mode.maxQuestions, deckTotal);
  const effectiveMinQuestions = Math.min(mode.minQuestions, effectiveMaxQuestions);

  const durationPresets = useMemo(
    () => (isKeyConcepts ? KEY_CONCEPTS_BLITZ_DURATIONS : presetOptions(mode.minDurationMinutes, mode.maxDurationMinutes)),
    [isKeyConcepts, mode.minDurationMinutes, mode.maxDurationMinutes]
  );

  const selectMode = (nextMode: GameMode) => {
    setGameMode(nextMode);
    const config = GAME_MODES[nextMode];
    setSelectedQuestions(Math.min(config.minQuestions, deckTotal || config.minQuestions));
    setDurationMinutes(isKeyConcepts ? KEY_CONCEPTS_BLITZ_DURATIONS[0] : config.minDurationMinutes);
  };

  const finalQuestionCount = mode.customizable
    ? Math.min(Math.max(selectedQuestions, effectiveMinQuestions), effectiveMaxQuestions)
    : effectiveMaxQuestions;
  const finalDurationMinutes = mode.customizable ? durationMinutes : mode.maxDurationMinutes;
  const canStart = finalQuestionCount > 0;

  const adjustQuestionCount = (delta: number) => {
    setSelectedQuestions(Math.min(Math.max(finalQuestionCount + delta, effectiveMinQuestions), effectiveMaxQuestions));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{deckName}</Text>
      <Text style={styles.description}>
        {questionCount === null ? 'Carregando...' : `${deckTotal} pergunta${deckTotal === 1 ? '' : 's'} disponível${deckTotal === 1 ? '' : 'eis'} neste baralho.`}
      </Text>

      {allowedModes.length > 1 && (
        <>
          <Text style={styles.sectionLabel}>Estilo de jogo</Text>
          <View style={styles.modeRow}>
            {allowedModes.map((id) => {
              const config = GAME_MODES[id];
              const isSelected = id === gameMode;
              return (
                <Pressable
                  key={id}
                  style={[styles.modeCard, isSelected && styles.modeCardSelected]}
                  onPress={() => selectMode(id)}
                >
                  <Text style={[styles.modeLabel, isSelected && styles.modeLabelSelected]}>{config.label}</Text>
                  <Text style={styles.modeDescription}>{config.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {mode.customizable ? (
        <>
          <Text style={styles.sectionLabel}>Número de perguntas</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={[styles.stepperButton, finalQuestionCount <= effectiveMinQuestions && styles.stepperButtonDisabled]}
              onPress={() => adjustQuestionCount(-5)}
              disabled={finalQuestionCount <= effectiveMinQuestions}
            >
              <Text style={styles.stepperButtonText}>-5</Text>
            </Pressable>
            <Pressable
              style={[styles.stepperButton, finalQuestionCount <= effectiveMinQuestions && styles.stepperButtonDisabled]}
              onPress={() => adjustQuestionCount(-1)}
              disabled={finalQuestionCount <= effectiveMinQuestions}
            >
              <Text style={styles.stepperButtonText}>-1</Text>
            </Pressable>
            <View style={styles.stepperValueBox}>
              <Text style={styles.stepperValue}>{finalQuestionCount}</Text>
            </View>
            <Pressable
              style={[styles.stepperButton, finalQuestionCount >= effectiveMaxQuestions && styles.stepperButtonDisabled]}
              onPress={() => adjustQuestionCount(1)}
              disabled={finalQuestionCount >= effectiveMaxQuestions}
            >
              <Text style={styles.stepperButtonText}>+1</Text>
            </Pressable>
            <Pressable
              style={[styles.stepperButton, finalQuestionCount >= effectiveMaxQuestions && styles.stepperButtonDisabled]}
              onPress={() => adjustQuestionCount(5)}
              disabled={finalQuestionCount >= effectiveMaxQuestions}
            >
              <Text style={styles.stepperButtonText}>+5</Text>
            </Pressable>
          </View>
          <Text style={styles.rangeHint}>
            De {effectiveMinQuestions} até {effectiveMaxQuestions} perguntas.
          </Text>

          {!mode.untimed && (
            <>
              <Text style={styles.sectionLabel}>Tempo para responder</Text>
              <View style={styles.pillRow}>
                {durationPresets.map((minutes) => {
                  const isSelected = minutes === durationMinutes;
                  return (
                    <Pressable
                      key={minutes}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setDurationMinutes(minutes)}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{minutes} min</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </>
      ) : (
        <View style={styles.fixedInfo}>
          <Text style={styles.fixedInfoText}>
            {finalQuestionCount} pergunta{finalQuestionCount === 1 ? '' : 's'} · {finalDurationMinutes} min
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        disabled={!canStart}
        onPress={() =>
          navigation.navigate('Quiz', {
            deckId,
            deckName,
            deckKind,
            gameMode,
            questionCount: finalQuestionCount,
            durationMinutes: finalDurationMinutes,
          })
        }
      >
        <Text style={styles.startButtonText}>Iniciar</Text>
      </Pressable>
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
    description: {
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      fontFamily: typography.fontFamily.regular,
    },
    sectionLabel: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    modeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    modeCard: {
      flexGrow: 1,
      flexBasis: '30%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    modeCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    modeLabel: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
    },
    modeLabelSelected: {
      color: colors.accent,
    },
    modeDescription: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      marginTop: spacing.unit,
      fontFamily: typography.fontFamily.regular,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    stepperButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    stepperButtonDisabled: {
      opacity: 0.4,
    },
    stepperButtonText: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
    },
    stepperValueBox: {
      flex: 1,
      alignItems: 'center',
    },
    stepperValue: {
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.accent,
    },
    rangeHint: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      fontFamily: typography.fontFamily.regular,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    pill: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    pillSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    pillText: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.medium,
    },
    pillTextSelected: {
      color: colors.accent,
    },
    fixedInfo: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    fixedInfoText: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.sm,
    },
    startButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: 'auto',
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      color: colors.textOnAccent,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.md,
    },
  });
}
