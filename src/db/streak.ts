import { getDatabase } from './database';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

/** Local (device) calendar date as YYYY-MM-DD — deliberately not UTC/ISO. */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`);
  const to = new Date(`${toDateStr}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export async function getUserStreak(userId: number): Promise<StreakInfo> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<StreakInfo>(
    `SELECT current_streak as currentStreak, longest_streak as longestStreak,
            last_active_date as lastActiveDate
     FROM users WHERE id = ?`,
    userId
  );
  return row ?? { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
}

/**
 * Marks today (device local date) as an active day and updates the streak.
 * The comparison is anchored to last_active_date already persisted in SQLite
 * rather than trusting the device clock on its own: a date that doesn't move
 * the streak forward by exactly one day either repeats today's entry (no-op)
 * or resets the streak — and a clock that appears to have moved backwards is
 * ignored outright so it can't rewrite an already-recorded day.
 */
export async function recordDailyActivity(
  userId: number,
  today: string = getLocalDateString()
): Promise<StreakInfo & { isNewDay: boolean }> {
  const db = await getDatabase();
  const current = await getUserStreak(userId);

  if (current.lastActiveDate === today) {
    return { ...current, isNewDay: false };
  }

  if (current.lastActiveDate && daysBetween(current.lastActiveDate, today) < 0) {
    return { ...current, isNewDay: false };
  }

  const gap = current.lastActiveDate ? daysBetween(current.lastActiveDate, today) : null;
  const nextStreak = gap === 1 ? current.currentStreak + 1 : 1;
  const nextLongest = Math.max(current.longestStreak, nextStreak);

  await db.runAsync(
    'UPDATE users SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?',
    nextStreak,
    nextLongest,
    today,
    userId
  );

  return { currentStreak: nextStreak, longestStreak: nextLongest, lastActiveDate: today, isNewDay: true };
}
