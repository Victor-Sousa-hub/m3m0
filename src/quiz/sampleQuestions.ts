import type { Question } from '../types/models';
import { shuffleArray } from './shuffle';

/** Shuffles, then takes the first `count` — avoids bias toward earlier items. */
export function sampleQuestions(questions: Question[], count: number): Question[] {
  return shuffleArray(questions).slice(0, count);
}
