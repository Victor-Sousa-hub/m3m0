import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as deckRepository from '../data/deckRepository';
import * as attemptRepository from '../data/attemptRepository';
import * as streakRepository from '../data/streakRepository';
import { sampleQuestions } from '../quiz/sampleQuestions';
import { shuffleArray } from '../quiz/shuffle';
import { computeFinalScore } from '../quiz/scoring';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import type { Question } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function QuizScreen({ route, navigation }: Props) {
  const { deckId, deckName, deckKind, gameMode, questionCount, durationMinutes } = route.params;
  const user = useCurrentUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<number>>(new Set());
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  const scoreRef = useRef(0);
  const hasFinishedRef = useRef(false);
  const questionStartedAtRef = useRef(Date.now());
  const quizStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    deckRepository.getQuestionsForDeck(deckId).then((all) => {
      setQuestions(sampleQuestions(all, questionCount));
    });
  }, [deckId, questionCount]);

  const totalQuestions = questions?.length ?? 0;

  useEffect(() => {
    if (questions) {
      questionStartedAtRef.current = Date.now();
      if (quizStartedAtRef.current === null) {
        quizStartedAtRef.current = Date.now();
      }
    }
  }, [questions, currentIndex]);

  const finishQuiz = useCallback(
    async (finalScore: number) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      const startedAt = quizStartedAtRef.current ?? Date.now();
      const timeTakenSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
      const finalPoints = computeFinalScore({
        correctCount: finalScore,
        timeTakenSeconds,
      });
      await attemptRepository.saveAttempt({
        userId: user.id,
        deckId,
        deckName,
        score: finalScore,
        totalQuestions,
        durationMinutes,
        timeTakenSeconds,
        points: finalPoints,
        gameMode,
      });
      const streak = await streakRepository.recordDailyActivity(user.id);
      navigation.replace('Results', {
        deckName,
        gameMode,
        score: finalScore,
        total: totalQuestions,
        points: finalPoints,
        durationMinutes,
        timeTakenSeconds,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        isNewStreakDay: streak.isNewDay,
      });
    },
    [deckId, deckName, durationMinutes, gameMode, navigation, totalQuestions, user.id]
  );

  useEffect(() => {
    if (!questions || totalQuestions === 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishQuiz(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [questions, totalQuestions, finishQuiz]);

  const currentQuestion = questions?.[currentIndex] ?? null;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const correctOptionIds = useMemo(
    () => new Set(currentQuestion?.options.filter((o) => o.isCorrect).map((o) => o.id) ?? []),
    [currentQuestion]
  );

  // Key-concepts source data always lists the correct option first; shuffle per question so it isn't a giveaway.
  const displayOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return deckKind === 'key_concepts' ? shuffleArray(currentQuestion.options) : currentQuestion.options;
  }, [currentQuestion, deckKind]);

  const isCurrentAnswerCorrect = useMemo(() => {
    if (selectedOptionIds.size !== correctOptionIds.size) return false;
    for (const id of selectedOptionIds) {
      if (!correctOptionIds.has(id)) return false;
    }
    return true;
  }, [selectedOptionIds, correctOptionIds]);

  if (!questions) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (totalQuestions === 0 || !currentQuestion) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyText}>Este baralho ainda não tem perguntas.</Text>
      </View>
    );
  }

  const toggleOption = (optionId: number) => {
    if (isAnswered) return;
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (currentQuestion.multipleAnswers) {
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          next.add(optionId);
        }
      } else {
        next.clear();
        next.add(optionId);
      }
      return next;
    });
  };

  const confirmAnswer = () => {
    if (selectedOptionIds.size === 0) return;
    setIsAnswered(true);
    if (isCurrentAnswerCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
  };

  const goToNext = async () => {
    if (isLastQuestion) {
      await finishQuiz(scoreRef.current);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOptionIds(new Set());
    setIsAnswered(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.progress}>
          Pergunta {currentIndex + 1} de {totalQuestions}
        </Text>
        <View style={styles.headerBadges}>
          <Text style={[styles.timerText, secondsLeft <= 10 && styles.timerTextUrgent]}>
            {formatTime(secondsLeft)}
          </Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{score} acertos</Text>
          </View>
        </View>
      </View>

      <Text style={styles.questionText}>{currentQuestion.text}</Text>
      {currentQuestion.multipleAnswers && (
        <Text style={styles.hint}>Selecione todas as respostas corretas.</Text>
      )}

      <View style={styles.options}>
        {displayOptions.map((option) => {
          const isSelected = selectedOptionIds.has(option.id);
          const isCorrectOption = correctOptionIds.has(option.id);

          let optionStyle = styles.option;
          if (isAnswered) {
            if (isCorrectOption) {
              optionStyle = { ...styles.option, ...styles.optionCorrect };
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.option, ...styles.optionIncorrect };
            }
          } else if (isSelected) {
            optionStyle = { ...styles.option, ...styles.optionSelected };
          }

          return (
            <Pressable
              key={option.id}
              style={optionStyle}
              onPress={() => toggleOption(option.id)}
              disabled={isAnswered}
            >
              <Text style={styles.optionText}>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>

      {isAnswered && (
        <View style={styles.feedback}>
          <Text style={isCurrentAnswerCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}>
            {isCurrentAnswerCorrect ? 'Resposta correta!' : 'Resposta incorreta.'}
          </Text>
          {currentQuestion.explanation && (
            <Text style={styles.explanation}>{currentQuestion.explanation}</Text>
          )}
        </View>
      )}

      {!isAnswered ? (
        <Pressable
          style={[styles.button, selectedOptionIds.size === 0 && styles.buttonDisabled]}
          onPress={confirmAnswer}
          disabled={selectedOptionIds.size === 0}
        >
          <Text style={styles.buttonText}>Confirmar</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.button} onPress={goToNext}>
          <Text style={styles.buttonText}>{isLastQuestion ? 'Finalizar' : 'Próxima'}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    progress: {
      color: colors.textMuted,
      fontSize: 14,
    },
    headerBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    timerText: {
      color: colors.text,
      fontVariant: ['tabular-nums'],
      fontWeight: '600',
      fontSize: 14,
    },
    timerTextUrgent: {
      color: colors.danger,
    },
    scoreBadge: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    scoreText: {
      color: colors.primaryText,
      fontWeight: '600',
      fontSize: 13,
    },
    questionText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 12,
    },
    options: {
      marginTop: 16,
      gap: 10,
    },
    option: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    optionCorrect: {
      borderColor: colors.success,
      backgroundColor: colors.successSoft,
    },
    optionIncorrect: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerSoft,
    },
    optionText: {
      fontSize: 15,
      color: colors.text,
    },
    feedback: {
      marginTop: 16,
    },
    feedbackCorrect: {
      color: colors.success,
      fontWeight: '700',
      fontSize: 15,
    },
    feedbackIncorrect: {
      color: colors.danger,
      fontWeight: '700',
      fontSize: 15,
    },
    explanation: {
      marginTop: 6,
      color: colors.textMuted,
      fontSize: 14,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: colors.primaryText,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
