export type GameMode = 'blitz' | 'thinking' | 'simulado';

/** AWS Certified Machine Learning Engineer - Associate (MLA-C01) real exam numbers. */
export const MLA_C01_EXAM_QUESTIONS = 65;
export const MLA_C01_EXAM_DURATION_MINUTES = 130;

export interface GameModeConfig {
  id: GameMode;
  label: string;
  description: string;
  minQuestions: number;
  maxQuestions: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  /** false = fixed question count and duration, no customization allowed. */
  customizable: boolean;
}

export const GAME_MODE_ORDER: GameMode[] = ['blitz', 'thinking', 'simulado'];

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  blitz: {
    id: 'blitz',
    label: 'Blitz',
    description: 'Rápido e direto: poucas perguntas, pouco tempo.',
    minQuestions: 5,
    maxQuestions: 10,
    minDurationMinutes: 1,
    maxDurationMinutes: 15,
    customizable: true,
  },
  thinking: {
    id: 'thinking',
    label: 'Thinking',
    description: 'Mais perguntas e mais tempo pra pensar com calma.',
    minQuestions: 10,
    maxQuestions: MLA_C01_EXAM_QUESTIONS,
    minDurationMinutes: 1,
    maxDurationMinutes: MLA_C01_EXAM_DURATION_MINUTES,
    customizable: true,
  },
  simulado: {
    id: 'simulado',
    label: 'Simulado',
    description: `A prova real: ${MLA_C01_EXAM_QUESTIONS} questões em ${MLA_C01_EXAM_DURATION_MINUTES} minutos.`,
    minQuestions: MLA_C01_EXAM_QUESTIONS,
    maxQuestions: MLA_C01_EXAM_QUESTIONS,
    minDurationMinutes: MLA_C01_EXAM_DURATION_MINUTES,
    maxDurationMinutes: MLA_C01_EXAM_DURATION_MINUTES,
    customizable: false,
  },
};

/**
 * ~`approxCount` evenly-spaced preset options between a range's min and max,
 * always including both endpoints — used for the question-count/duration
 * pill rows so a 1-130 range and a 5-10 range both render a sane number of
 * pills instead of one pill per unit or one giant step.
 */
export function presetOptions(min: number, max: number, approxCount = 5): number[] {
  if (min >= max) return [min];
  const step = Math.max(1, Math.round((max - min) / (approxCount - 1)));
  const options = new Set<number>();
  for (let value = min; value < max; value += step) {
    options.add(value);
  }
  options.add(max);
  return [...options].sort((a, b) => a - b);
}
