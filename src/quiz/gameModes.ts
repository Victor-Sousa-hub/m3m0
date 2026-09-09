export type GameMode = 'blitz' | 'thinking' | 'study' | 'simulado';

/**
 * 'exam' decks are practice-test style (N options, multi-answer allowed) and
 * play in any pacing style. 'key_concepts' decks are concept-name + exactly
 * 4 alternatives — fast recall (Blitz) or untimed review (Study), see
 * ALLOWED_GAME_MODES_BY_DECK_KIND.
 */
export type DeckKind = 'exam' | 'key_concepts';

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
  /** true = no countdown, no auto-submit on time up, no speed bonus in scoring. */
  untimed?: boolean;
}

export const GAME_MODE_ORDER: GameMode[] = ['blitz', 'thinking', 'study', 'simulado'];

/**
 * Attempt records can arrive from a sync backend that predates game modes
 * (not yet migrated/redeployed) or from a stale client, so `gameMode` isn't
 * guaranteed to be a known value — normalize it at the data boundary instead
 * of trusting it, same rationale as validating imported question sets.
 */
export function normalizeGameMode(value: unknown): GameMode {
  return value === 'blitz' || value === 'thinking' || value === 'study' || value === 'simulado'
    ? value
    : 'thinking';
}

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
  study: {
    id: 'study',
    label: 'Study',
    description: 'Sem cronômetro: revise no seu ritmo, sem pressa.',
    minQuestions: 10,
    maxQuestions: MLA_C01_EXAM_QUESTIONS,
    minDurationMinutes: 0,
    maxDurationMinutes: 0,
    customizable: true,
    untimed: true,
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

/** Which pacing styles a deck kind can be played in — see DeckKind. */
export const ALLOWED_GAME_MODES_BY_DECK_KIND: Record<DeckKind, GameMode[]> = {
  exam: GAME_MODE_ORDER,
  key_concepts: ['blitz', 'study'],
};

/** Fixed duration choices for key-concepts decks, replacing Blitz's normal 1-15 min range. */
export const KEY_CONCEPTS_BLITZ_DURATIONS = [1, 3];

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
