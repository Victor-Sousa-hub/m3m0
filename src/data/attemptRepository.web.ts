import { getSyncState } from '../db/syncState';
import { syncPush, syncPull } from '../sync/apiClient';
import type { AttemptRecord } from './attemptRecord';
import type { GameMode } from '../quiz/gameModes';

async function requireSecret(): Promise<string> {
  const state = await getSyncState();
  if (!state) throw new Error('Dispositivo não pareado.');
  return state.syncSecret;
}

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
  const secret = await requireSecret();
  const today = new Date();
  const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  await syncPush(secret, {
    activeDays: [isoDate],
    attempts: [
      {
        clientId: crypto.randomUUID(),
        deckName: params.deckName,
        score: params.score,
        totalQuestions: params.totalQuestions,
        durationMinutes: params.durationMinutes,
        timeTakenSeconds: params.timeTakenSeconds,
        points: params.points,
        completedAt: today.toISOString(),
        gameMode: params.gameMode,
      },
    ],
  });
}

export async function getAttemptsForDeck(
  _userId: number,
  _deckId: number,
  deckName: string
): Promise<AttemptRecord[]> {
  const all = await getAllAttempts(_userId);
  return all.filter((attempt) => attempt.deckName === deckName);
}

export async function getAllAttempts(_userId: number): Promise<AttemptRecord[]> {
  const secret = await requireSecret();
  const { attempts } = await syncPull(secret);
  return attempts
    .map((attempt) => ({
      clientId: attempt.clientId,
      deckName: attempt.deckName,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      durationMinutes: attempt.durationMinutes,
      timeTakenSeconds: attempt.timeTakenSeconds,
      points: attempt.points,
      completedAt: attempt.completedAt,
      gameMode: attempt.gameMode,
    }))
    .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
}
