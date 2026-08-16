import type { Question } from '../types/models';

/** Fisher-Yates shuffle, then take the first `count` — avoids bias toward earlier items. */
export function sampleQuestions(questions: Question[], count: number): Question[] {
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
