import { getDatabase } from './database';
import type { QuizAttempt } from '../types/models';

export async function saveQuizAttempt(params: {
  userId: number;
  deckId: number;
  score: number;
  totalQuestions: number;
}): Promise<QuizAttempt> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO quiz_attempts (user_id, deck_id, score, total_questions) VALUES (?, ?, ?, ?)',
    params.userId,
    params.deckId,
    params.score,
    params.totalQuestions
  );
  const attempt = await db.getFirstAsync<QuizAttempt>(
    `SELECT id, user_id as userId, deck_id as deckId, score, total_questions as totalQuestions,
            completed_at as completedAt
     FROM quiz_attempts WHERE id = ?`,
    result.lastInsertRowId
  );
  if (!attempt) {
    throw new Error('Failed to save quiz attempt');
  }
  return attempt;
}

export async function getAttemptsForDeck(userId: number, deckId: number): Promise<QuizAttempt[]> {
  const db = await getDatabase();
  return db.getAllAsync<QuizAttempt>(
    `SELECT id, user_id as userId, deck_id as deckId, score, total_questions as totalQuestions,
            completed_at as completedAt
     FROM quiz_attempts
     WHERE user_id = ? AND deck_id = ?
     ORDER BY completed_at DESC`,
    userId,
    deckId
  );
}
