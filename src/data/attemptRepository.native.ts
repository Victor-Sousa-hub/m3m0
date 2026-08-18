import { getAllAttemptsForUser, getAttemptsForDeck as getAttemptsForDeckLocal, saveQuizAttempt } from '../db/scores';
import { getSyncState } from '../db/syncState';
import { syncPull } from '../sync/apiClient';
import { syncNow } from '../sync/syncClient';
import type { AttemptRecord } from './attemptRecord';
import { normalizeGameMode, type GameMode } from '../quiz/gameModes';

export async function saveAttempt(params: {
  userId: number;
  deckId: number;
  deckName: string;
  score: number;
  totalQuestions: number;
  durationMinutes: number;
  timeTakenSeconds: number;
  points: number;
  gameMode: GameMode;
}): Promise<void> {
  await saveQuizAttempt(params);
  syncNow(); // fire-and-forget, never blocks the quiz flow
}

/** Per-deck history — local-only (this device's plays for that deck). */
export async function getAttemptsForDeck(
  userId: number,
  deckId: number,
  deckName: string
): Promise<AttemptRecord[]> {
  const rows = await getAttemptsForDeckLocal(userId, deckId);
  return rows.map((row) => ({
    clientId: null,
    deckName,
    score: row.score,
    totalQuestions: row.totalQuestions,
    durationMinutes: row.durationMinutes,
    timeTakenSeconds: row.timeTakenSeconds,
    points: row.points,
    completedAt: row.completedAt,
    gameMode: normalizeGameMode(row.gameMode),
  }));
}

/**
 * Cross-device history for the stats screen: local attempts plus, if paired,
 * whatever attempts other devices pushed to the backend that aren't already
 * known locally (deduped by clientId).
 */
export async function getAllAttempts(userId: number): Promise<AttemptRecord[]> {
  const local = await getAllAttemptsForUser(userId);
  const localRecords: AttemptRecord[] = local.map((row) => ({
    clientId: row.clientId,
    deckName: row.deckName,
    score: row.score,
    totalQuestions: row.totalQuestions,
    durationMinutes: row.durationMinutes,
    timeTakenSeconds: row.timeTakenSeconds,
    points: row.points,
    completedAt: row.completedAt,
    gameMode: normalizeGameMode(row.gameMode),
  }));

  const state = await getSyncState();
  if (!state) return localRecords;

  try {
    const remote = await syncPull(state.syncSecret);
    const knownClientIds = new Set(localRecords.map((r) => r.clientId).filter((id): id is string => !!id));
    const remoteOnly: AttemptRecord[] = remote.attempts
      .filter((attempt) => !knownClientIds.has(attempt.clientId))
      .map((attempt) => ({
        clientId: attempt.clientId,
        deckName: attempt.deckName,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        durationMinutes: attempt.durationMinutes,
        timeTakenSeconds: attempt.timeTakenSeconds,
        points: attempt.points,
        completedAt: attempt.completedAt,
        gameMode: normalizeGameMode(attempt.gameMode),
      }));
    return [...localRecords, ...remoteOnly].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
  } catch {
    return localRecords;
  }
}
