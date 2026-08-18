import { getDatabase } from '../db/database';
import { getSyncState, markSynced } from '../db/syncState';
import { syncPush, syncPull, type AttemptPayload } from './apiClient';

/**
 * Pushes locally-recorded (unsynced) active days and quiz attempts, then
 * pulls the merged active-day set back so cross-device streak stays
 * consistent. Never throws — offline/unreachable just leaves rows unsynced
 * for the next opportunistic call (app boot, after an attempt, deck list
 * focus, or the manual "Sincronizar agora" button).
 */
export async function syncNow(): Promise<void> {
  const state = await getSyncState();
  if (!state) return;

  const db = await getDatabase();

  const pendingDays = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM active_days WHERE synced = 0'
  );
  const pendingAttempts = await db.getAllAsync<AttemptPayload>(
    `SELECT qa.client_id as clientId, d.name as deckName, qa.score, qa.total_questions as totalQuestions,
            qa.duration_minutes as durationMinutes, qa.time_taken_seconds as timeTakenSeconds, qa.points,
            qa.completed_at as completedAt
     FROM quiz_attempts qa
     JOIN decks d ON d.id = qa.deck_id
     WHERE qa.synced = 0 AND qa.client_id IS NOT NULL`
  );

  try {
    await syncPush(state.syncSecret, {
      activeDays: pendingDays.map((d) => d.date),
      attempts: pendingAttempts,
    });
    await db.runAsync('UPDATE active_days SET synced = 1 WHERE synced = 0');
    await db.runAsync('UPDATE quiz_attempts SET synced = 1 WHERE synced = 0');

    const pulled = await syncPull(state.syncSecret);
    for (const date of pulled.activeDays) {
      await db.runAsync('INSERT OR IGNORE INTO active_days (date, synced) VALUES (?, 1)', date);
    }

    await markSynced();
  } catch {
    // Offline or backend unreachable — retried opportunistically later.
  }
}
