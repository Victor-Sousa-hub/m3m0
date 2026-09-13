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

/** How many consecutive streak-days earn one banked freeze. */
export const FREEZE_EARN_INTERVAL_DAYS = 15;
/** Max freezes that can be banked at once — earning pauses at the cap until one is spent. */
export const MAX_BANKED_FREEZES = 3;

export interface StreakWithFreezeResult extends StreakResult {
  /** Freezes currently banked, after accounting for any spent bridging historical gaps. */
  freezesAvailable: number;
  /** True when today hasn't been played yet and a banked freeze is the only thing
   * keeping yesterday's (or an earlier) gap from breaking the streak right now. */
  isFrozenToday: boolean;
}

export interface StreakInfo extends StreakWithFreezeResult {
  lastActiveDate: string | null;
}

/**
 * Pure streak calculation over a set of active calendar dates — shared by
 * the native (SQLite `active_days`) and web (backend `/sync/pull`) data
 * layers so both platforms agree on the same streak from the same dates,
 * regardless of which device recorded which day. A banked freeze silently
 * covers a fully-skipped day (or several, if enough are banked) instead of
 * breaking the streak. Freezes are never stored separately — they're
 * derived purely from `dates` by replaying history chronologically, so a
 * freeze earned on one device is correct everywhere the moment `active_days`
 * itself is synced, and it retroactively "heals" any single-day gaps already
 * in the current streak.
 *
 * Earning: every time the running streak crosses a new multiple of
 * {@link FREEZE_EARN_INTERVAL_DAYS}, +1 freeze is banked, capped at
 * {@link MAX_BANKED_FREEZES} (earning pauses at the cap until one is spent).
 * Spending: a gap of N fully-skipped days consumes N banked freezes if
 * available; otherwise the streak resets.
 */
export function computeStreakWithFreezes(dates: string[], today: string): StreakWithFreezeResult {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0, freezesAvailable: 0, isFrozenToday: false };
  }

  let freezes = 0;
  let earnedThrough = 0; // running-streak length up to which freezes have already been banked
  let run = 1;
  let longestStreak = 1;

  const bankEarnedFreezes = () => {
    while (run - earnedThrough >= FREEZE_EARN_INTERVAL_DAYS) {
      earnedThrough += FREEZE_EARN_INTERVAL_DAYS;
      freezes = Math.min(MAX_BANKED_FREEZES, freezes + 1);
    }
  };

  for (let i = 1; i < sorted.length; i += 1) {
    const missedDays = daysBetween(sorted[i - 1], sorted[i]) - 1;
    if (missedDays === 0) {
      run += 1;
    } else if (freezes >= missedDays) {
      freezes -= missedDays;
      run += 1;
    } else {
      run = 1;
      earnedThrough = 0;
    }
    longestStreak = Math.max(longestStreak, run);
    bankEarnedFreezes();
  }

  const missedUntilToday = daysBetween(sorted[sorted.length - 1], today) - 1;
  let currentStreak = run;
  let isFrozenToday = false;

  if (missedUntilToday > 0) {
    if (freezes >= missedUntilToday) {
      freezes -= missedUntilToday;
      isFrozenToday = true;
    } else {
      currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak, freezesAvailable: freezes, isFrozenToday };
}
