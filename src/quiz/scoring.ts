export const BASE_POINTS_PER_CORRECT_ANSWER = 100;
export const MAX_SPEED_BONUS = 50;

/** Per-question time budget: the exam duration split evenly across questions. */
export function timeBudgetPerQuestion(durationMinutes: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.max(5, Math.floor((durationMinutes * 60) / totalQuestions));
}

/**
 * Wrong answers score zero — points reward accuracy first. Correct answers get
 * a flat base plus a speed bonus that scales down linearly from full (answered
 * instantly) to none (answered at or past the per-question time budget).
 */
export function computeQuestionPoints(params: {
  isCorrect: boolean;
  timeTakenSeconds: number;
  timeBudgetSeconds: number;
}): number {
  if (!params.isCorrect) return 0;
  const budget = Math.max(1, params.timeBudgetSeconds);
  const speedRatio = Math.min(1, Math.max(0, 1 - params.timeTakenSeconds / budget));
  const speedBonus = Math.round(speedRatio * MAX_SPEED_BONUS);
  return BASE_POINTS_PER_CORRECT_ANSWER + speedBonus;
}
