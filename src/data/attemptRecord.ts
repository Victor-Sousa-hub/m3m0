import { GAME_MODE_ORDER, type GameMode } from '../quiz/gameModes';

/**
 * Platform-agnostic view of a quiz attempt used by StatsScreen/DeckDetailScreen.
 * clientId is null for legacy local rows created before sync existed.
 */
export interface AttemptRecord {
  clientId: string | null;
  deckName: string;
  score: number;
  totalQuestions: number;
  durationMinutes: number;
  timeTakenSeconds: number;
  points: number;
  completedAt: string;
  gameMode: GameMode;
}

/** Personal best (by points) per game mode — the "me vs. me" scoreboard. */
export function bestAttemptPerMode(attempts: AttemptRecord[]): AttemptRecord[] {
  const bestByMode = new Map<GameMode, AttemptRecord>();
  for (const attempt of attempts) {
    const current = bestByMode.get(attempt.gameMode);
    if (!current || attempt.points > current.points) {
      bestByMode.set(attempt.gameMode, attempt);
    }
  }
  return [...bestByMode.values()].sort(
    (a, b) => GAME_MODE_ORDER.indexOf(a.gameMode) - GAME_MODE_ORDER.indexOf(b.gameMode)
  );
}
