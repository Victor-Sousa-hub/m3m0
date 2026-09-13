import { getSyncState } from '../db/syncState';
import { syncPull, syncPush } from '../sync/apiClient';
import { computeStreakWithFreezes, getLocalDateString, type StreakInfo } from '../sync/streakMath';

async function computeFromBackend(): Promise<StreakInfo> {
  const state = await getSyncState();
  if (!state) {
    return { currentStreak: 0, longestStreak: 0, freezesAvailable: 0, isFrozenToday: false, lastActiveDate: null };
  }

  const { activeDays } = await syncPull(state.syncSecret);
  const today = getLocalDateString();
  const { currentStreak, longestStreak, freezesAvailable, isFrozenToday } = computeStreakWithFreezes(
    activeDays,
    today
  );
  const lastActiveDate = activeDays.length > 0 ? [...activeDays].sort().at(-1)! : null;
  return { currentStreak, longestStreak, freezesAvailable, isFrozenToday, lastActiveDate };
}

export async function getStreak(_userId: number): Promise<StreakInfo> {
  return computeFromBackend();
}

export async function recordDailyActivity(
  _userId: number
): Promise<StreakInfo & { isNewDay: boolean }> {
  const state = await getSyncState();
  if (!state) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      freezesAvailable: 0,
      isFrozenToday: false,
      lastActiveDate: null,
      isNewDay: false,
    };
  }

  const today = getLocalDateString();
  const before = await computeFromBackend();
  const isNewDay = before.lastActiveDate !== today;

  if (isNewDay) {
    await syncPush(state.syncSecret, { activeDays: [today], attempts: [] });
  }

  const after = isNewDay ? await computeFromBackend() : before;
  return { ...after, isNewDay };
}
