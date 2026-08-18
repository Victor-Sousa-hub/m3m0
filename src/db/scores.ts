import { getDatabase } from './database';
import type { QuizAttempt } from '../types/models';

const ATTEMPT_COLUMNS = `id, user_id as userId, deck_id as deckId, score, total_questions as totalQuestions,
       duration_minutes as durationMinutes, time_taken_seconds as timeTakenSeconds, points,
       completed_at as completedAt`;

export interface QuizAttemptWithDeck extends QuizAttempt {
  deckName: string;
  clientId: string | null;
}

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
       (user_id, deck_id, score, total_questions, duration_minutes, time_taken_seconds, points, client_id, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, lower(hex(randomblob(16))), 0)`,
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

/** All attempts across every deck, newest first — feeds the stats screen's history/scoreboard. */
export async function getAllAttemptsForUser(userId: number): Promise<QuizAttemptWithDeck[]> {
  const db = await getDatabase();
  return db.getAllAsync<QuizAttemptWithDeck>(
    `SELECT qa.id, qa.user_id as userId, qa.deck_id as deckId, qa.score,
            qa.total_questions as totalQuestions, qa.duration_minutes as durationMinutes,
            qa.time_taken_seconds as timeTakenSeconds, qa.points, qa.completed_at as completedAt,
            d.name as deckName, qa.client_id as clientId
     FROM quiz_attempts qa
     JOIN decks d ON d.id = qa.deck_id
     WHERE qa.user_id = ?
     ORDER BY qa.completed_at DESC`,
    userId
  );
}
