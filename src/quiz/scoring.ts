/**
 * Final score for a finished quiz: rewards accuracy and speed together —
 * more correct answers and less time taken both push the score up, scaled
 * by how many questions were in play so bigger games are worth more.
 */
export function computeFinalScore(params: {
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
}): number {
  const minutesTaken = Math.max(params.timeTakenSeconds, 1) / 60;
  return Math.round(params.correctCount * (1 / minutesTaken) * params.totalQuestions);
}
