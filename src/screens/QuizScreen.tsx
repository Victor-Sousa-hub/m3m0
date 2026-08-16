import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getQuestionsForDeck } from '../db/questions';
import { saveQuizAttempt } from '../db/scores';
import { useCurrentUser } from '../context/UserContext';
import type { RootStackParamList } from '../navigation/types';
import type { Question } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export default function QuizScreen({ route, navigation }: Props) {
  const { deckId, deckName } = route.params;
  const user = useCurrentUser();

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<number>>(new Set());
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    getQuestionsForDeck(deckId).then(setQuestions);
  }, [deckId]);

  const currentQuestion = questions?.[currentIndex] ?? null;
  const totalQuestions = questions?.length ?? 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const correctOptionIds = useMemo(
    () => new Set(currentQuestion?.options.filter((o) => o.isCorrect).map((o) => o.id) ?? []),
    [currentQuestion]
  );

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
        <ActivityIndicator size="large" />
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
      setScore((prev) => prev + 1);
    }
  };

  const goToNext = async () => {
    if (isLastQuestion) {
      await saveQuizAttempt({
        userId: user.id,
        deckId,
        score,
        totalQuestions,
      });
      navigation.replace('Results', { deckName, score, total: totalQuestions });
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
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Pontuação: {score}</Text>
        </View>
      </View>

      <Text style={styles.questionText}>{currentQuestion.text}</Text>
      {currentQuestion.multipleAnswers && (
        <Text style={styles.hint}>Selecione todas as respostas corretas.</Text>
      )}

      <View style={styles.options}>
        {currentQuestion.options.map((option) => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progress: {
    color: '#666',
    fontSize: 14,
  },
  scoreBadge: {
    backgroundColor: '#2f6feb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  hint: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
  },
  options: {
    marginTop: 16,
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionSelected: {
    borderColor: '#2f6feb',
    backgroundColor: '#eaf1fd',
  },
  optionCorrect: {
    borderColor: '#2e9e5b',
    backgroundColor: '#e6f6ec',
  },
  optionIncorrect: {
    borderColor: '#c0392b',
    backgroundColor: '#fbeaea',
  },
  optionText: {
    fontSize: 15,
  },
  feedback: {
    marginTop: 16,
  },
  feedbackCorrect: {
    color: '#2e9e5b',
    fontWeight: '700',
    fontSize: 15,
  },
  feedbackIncorrect: {
    color: '#c0392b',
    fontWeight: '700',
    fontSize: 15,
  },
  explanation: {
    marginTop: 6,
    color: '#555',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2f6feb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
