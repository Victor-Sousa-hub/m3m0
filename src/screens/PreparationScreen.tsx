import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as deckRepository from '../data/deckRepository';
import { QUIZ_QUESTION_COUNT } from '../quiz/config';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Preparation'>;

const DURATION_OPTIONS = [1, 5, 10, 15];

export default function PreparationScreen({ route, navigation }: Props) {
  const { deckId, deckName } = route.params;
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(5);

  useEffect(() => {
    deckRepository.getQuestionCountForDeck(deckId).then(setQuestionCount);
  }, [deckId]);

  const questionsInQuiz =
    questionCount === null ? null : Math.min(QUIZ_QUESTION_COUNT, questionCount);
  const canStart = (questionsInQuiz ?? 0) > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{deckName}</Text>
      <Text style={styles.description}>
        {questionsInQuiz === null
          ? 'Carregando...'
          : `${questionsInQuiz} pergunta${questionsInQuiz === 1 ? '' : 's'} aleatória${questionsInQuiz === 1 ? '' : 's'} deste simulado.`}
      </Text>

      <Text style={styles.sectionLabel}>Tempo para responder</Text>
      <View style={styles.durationRow}>
        {DURATION_OPTIONS.map((minutes) => {
          const isSelected = minutes === durationMinutes;
          return (
            <Pressable
              key={minutes}
              style={[styles.durationOption, isSelected && styles.durationOptionSelected]}
              onPress={() => setDurationMinutes(minutes)}
            >
              <Text
                style={[styles.durationText, isSelected && styles.durationTextSelected]}
              >
                {minutes} min
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        disabled={!canStart}
        onPress={() => navigation.navigate('Quiz', { deckId, deckName, durationMinutes })}
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
    durationRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 32,
    },
    durationOption: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    durationOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    durationText: {
      color: colors.text,
      fontWeight: '600',
    },
    durationTextSelected: {
      color: colors.primary,
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
