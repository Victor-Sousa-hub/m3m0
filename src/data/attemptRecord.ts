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
}

/** Personal best (by points) per exam duration — the "me vs. me" scoreboard. */
export function bestAttemptPerDuration(attempts: AttemptRecord[]): AttemptRecord[] {
  const bestByDuration = new Map<number, AttemptRecord>();
  for (const attempt of attempts) {
    const current = bestByDuration.get(attempt.durationMinutes);
    if (!current || attempt.points > current.points) {
      bestByDuration.set(attempt.durationMinutes, attempt);
    }
  }
  return [...bestByDuration.values()].sort((a, b) => a.durationMinutes - b.durationMinutes);
}
