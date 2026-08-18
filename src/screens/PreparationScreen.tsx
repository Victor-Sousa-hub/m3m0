import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as deckRepository from '../data/deckRepository';
import { GAME_MODE_ORDER, GAME_MODES, presetOptions, type GameMode } from '../quiz/gameModes';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Preparation'>;

export default function PreparationScreen({ route, navigation }: Props) {
  const { deckId, deckName } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('blitz');
  const [selectedQuestions, setSelectedQuestions] = useState(GAME_MODES.blitz.minQuestions);
  const [durationMinutes, setDurationMinutes] = useState(GAME_MODES.blitz.minDurationMinutes);

  useEffect(() => {
    deckRepository.getQuestionCountForDeck(deckId).then(setQuestionCount);
  }, [deckId]);

  const mode = GAME_MODES[gameMode];
  const deckTotal = questionCount ?? 0;

  // Bounds clamped to what the deck actually has available.
  const effectiveMaxQuestions = Math.min(mode.maxQuestions, deckTotal);
  const effectiveMinQuestions = Math.min(mode.minQuestions, effectiveMaxQuestions);

  const questionPresets = useMemo(
    () => presetOptions(effectiveMinQuestions, Math.max(effectiveMinQuestions, effectiveMaxQuestions)),
    [effectiveMinQuestions, effectiveMaxQuestions]
  );
  const durationPresets = useMemo(
    () => presetOptions(mode.minDurationMinutes, mode.maxDurationMinutes),
    [mode.minDurationMinutes, mode.maxDurationMinutes]
  );

  const selectMode = (nextMode: GameMode) => {
    setGameMode(nextMode);
    const config = GAME_MODES[nextMode];
    setSelectedQuestions(Math.min(config.minQuestions, deckTotal || config.minQuestions));
    setDurationMinutes(config.minDurationMinutes);
  };

  const finalQuestionCount = mode.customizable
    ? Math.min(selectedQuestions, effectiveMaxQuestions)
    : effectiveMaxQuestions;
  const finalDurationMinutes = mode.customizable ? durationMinutes : mode.maxDurationMinutes;
  const canStart = finalQuestionCount > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{deckName}</Text>
      <Text style={styles.description}>
        {questionCount === null ? 'Carregando...' : `${deckTotal} pergunta${deckTotal === 1 ? '' : 's'} disponível${deckTotal === 1 ? '' : 'eis'} neste baralho.`}
      </Text>

      <Text style={styles.sectionLabel}>Estilo de jogo</Text>
      <View style={styles.modeRow}>
        {GAME_MODE_ORDER.map((id) => {
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

      {mode.customizable ? (
        <>
          <Text style={styles.sectionLabel}>Número de perguntas</Text>
          <View style={styles.pillRow}>
            {questionPresets.map((count) => {
              const isSelected = count === finalQuestionCount;
              return (
                <Pressable
                  key={count}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => setSelectedQuestions(count)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{count}</Text>
                </Pressable>
              );
            })}
          </View>

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
