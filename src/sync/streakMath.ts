/** Local (device) calendar date as YYYY-MM-DD — deliberately not UTC/ISO. */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`);
  const to = new Date(`${toDateStr}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export interface StreakInfo extends StreakResult {
  lastActiveDate: string | null;
}

/**
 * Pure streak calculation over a set of active calendar dates — shared by
 * the native (SQLite `active_days`) and web (backend `/sync/pull`) data
 * layers so both platforms agree on the same streak from the same dates,
 * regardless of which device recorded which day.
 *
 * currentStreak counts backwards from the most recent active date as long
 * as that date is today or yesterday (a day hasn't been played yet today
 * doesn't break the streak); anything older means the streak is broken.
 */
export function computeStreakFromDates(dates: string[], today: string): StreakResult {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  const mostRecent = sorted[sorted.length - 1];
  const gapToToday = daysBetween(mostRecent, today);
  let currentStreak = 0;
  if (gapToToday === 0 || gapToToday === 1) {
    currentStreak = 1;
    for (let i = sorted.length - 1; i > 0; i -= 1) {
      if (daysBetween(sorted[i - 1], sorted[i]) === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}
