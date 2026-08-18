import { getDatabase } from './database';
import { computeStreakFromDates, getLocalDateString, type StreakInfo } from '../sync/streakMath';

export type { StreakInfo };

async function getActiveDays(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string }>('SELECT date FROM active_days');
  return rows.map((r) => r.date);
}

/**
 * longest_streak on `users` predates active_days and can't be recomputed
 * exactly (the individual dates behind it were never stored) — it's kept
 * forever as a floor so a pre-migration record is never lost, while new
 * records set purely from active_days naturally overtake it over time.
 */
async function getLongestStreakFloor(userId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ longestStreak: number }>(
    'SELECT longest_streak as longestStreak FROM users WHERE id = ?',
    userId
  );
  return row?.longestStreak ?? 0;
}

export async function getUserStreak(userId: number): Promise<StreakInfo> {
  const dates = await getActiveDays();
  const today = getLocalDateString();
  const computed = computeStreakFromDates(dates, today);
  const floor = await getLongestStreakFloor(userId);

  return {
    currentStreak: computed.currentStreak,
    longestStreak: Math.max(computed.longestStreak, floor),
    lastActiveDate: dates.length > 0 ? [...dates].sort().at(-1)! : null,
  };
}

/** Marks today (device local date) as an active day and updates the streak. */
export async function recordDailyActivity(
  userId: number,
  today: string = getLocalDateString()
): Promise<StreakInfo & { isNewDay: boolean }> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ date: string }>(
    'SELECT date FROM active_days WHERE date = ?',
    today
  );
  const isNewDay = !existing;

  if (isNewDay) {
    await db.runAsync('INSERT INTO active_days (date, synced) VALUES (?, 0)', today);
  }

  const dates = await getActiveDays();
  const computed = computeStreakFromDates(dates, today);
  const floor = await getLongestStreakFloor(userId);
  const longestStreak = Math.max(computed.longestStreak, floor);
  if (longestStreak > floor) {
    await db.runAsync('UPDATE users SET longest_streak = ? WHERE id = ?', longestStreak, userId);
  }

  return {
    currentStreak: computed.currentStreak,
    longestStreak,
    lastActiveDate: today,
    isNewDay,
  };
}
