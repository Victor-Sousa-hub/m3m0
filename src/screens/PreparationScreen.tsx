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
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Preparation'>;

export default function PreparationScreen({ route, navigation }: Props) {
  const { deckId, deckName, deckKind } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    description: {
      color: colors.textMuted,
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    modeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    modeCard: {
      flexGrow: 1,
      flexBasis: '30%',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    modeCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    modeLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    modeLabelSelected: {
      color: colors.primary,
    },
    modeDescription: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    stepperButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    stepperButtonDisabled: {
      opacity: 0.4,
    },
    stepperButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
    stepperValueBox: {
      flex: 1,
      alignItems: 'center',
    },
    stepperValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.primary,
    },
    rangeHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 24,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    pill: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    pillSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    pillText: {
      color: colors.text,
      fontWeight: '600',
    },
    pillTextSelected: {
      color: colors.primary,
    },
    fixedInfo: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 24,
      alignItems: 'center',
    },
    fixedInfoText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 15,
    },
    startButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 'auto',
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      color: colors.primaryText,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
