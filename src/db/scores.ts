import { getDatabase } from './database';
import type { QuizAttempt } from '../types/models';

const ATTEMPT_COLUMNS = `id, user_id as userId, deck_id as deckId, score, total_questions as totalQuestions,
       duration_minutes as durationMinutes, time_taken_seconds as timeTakenSeconds, points,
       completed_at as completedAt`;

export async function saveQuizAttempt(params: {
  userId: number;
  deckId: number;
  score: number;
  totalQuestions: number;
  durationMinutes: number;
  timeTakenSeconds: number;
  points: number;
}): Promise<QuizAttempt> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO quiz_attempts
       (user_id, deck_id, score, total_questions, duration_minutes, time_taken_seconds, points)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params.userId,
    params.deckId,
    params.score,
    params.totalQuestions,
    params.durationMinutes,
    params.timeTakenSeconds,
    params.points
  );
  const attempt = await db.getFirstAsync<QuizAttempt>(
    `SELECT ${ATTEMPT_COLUMNS} FROM quiz_attempts WHERE id = ?`,
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
    `SELECT ${ATTEMPT_COLUMNS}
     FROM quiz_attempts
     WHERE user_id = ? AND deck_id = ?
     ORDER BY completed_at DESC`,
    userId,
    deckId
  );
}

/** Personal best (by points) per exam duration — the "me vs. me" scoreboard. */
export function bestAttemptPerDuration(attempts: QuizAttempt[]): QuizAttempt[] {
  const bestByDuration = new Map<number, QuizAttempt>();
  for (const attempt of attempts) {
    const current = bestByDuration.get(attempt.durationMinutes);
    if (!current || attempt.points > current.points) {
      bestByDuration.set(attempt.durationMinutes, attempt);
    }
  }
  return [...bestByDuration.values()].sort((a, b) => a.durationMinutes - b.durationMinutes);
}
