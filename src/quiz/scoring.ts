const POINTS_PER_CORRECT_ANSWER = 10;
/** Floor on seconds credited per correct answer, so a bogus/instant timing can't inflate the speed bonus unboundedly. */
const MIN_SECONDS_PER_CORRECT_ANSWER = 2;

/**
 * Final score for a finished quiz: correct answers are the primary driver
 * (10 points each, scaling linearly with how many you got right), with a
 * secondary speed bonus for finishing faster. Correctness dominates by
 * design — e.g. 10/10 in 5 minutes outscores 5/5 in 1 minute — while the
 * bonus still rewards being quick among runs with the same correct count.
 */
export function computeFinalScore(params: {
  correctCount: number;
  timeTakenSeconds: number;
  /** true = untimed mode (e.g. Study): no speed bonus, only correctness counts. */
  untimed?: boolean;
}): number {
  const basePoints = params.correctCount * POINTS_PER_CORRECT_ANSWER;
  if (params.untimed) return basePoints;

  const effectiveSeconds = Math.max(
    params.timeTakenSeconds,
    params.correctCount * MIN_SECONDS_PER_CORRECT_ANSWER,
    1
  );
  const speedBonus = Math.round((params.correctCount * 60) / effectiveSeconds);
  return basePoints + speedBonus;
}
