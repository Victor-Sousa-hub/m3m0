import { getUserStreak as getUserStreakLocal, recordDailyActivity as recordDailyActivityLocal } from '../db/streak';
import { syncNow } from '../sync/syncClient';
import type { StreakInfo } from '../sync/streakMath';

export async function getStreak(userId: number): Promise<StreakInfo> {
  return getUserStreakLocal(userId);
}

export async function recordDailyActivity(userId: number): Promise<StreakInfo & { isNewDay: boolean }> {
  const result = await recordDailyActivityLocal(userId);
  syncNow(); // fire-and-forget
  return result;
}
