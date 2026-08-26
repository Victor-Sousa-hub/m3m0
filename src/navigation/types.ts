import type { DeckKind, GameMode } from '../quiz/gameModes';

export type RootStackParamList = {
  Decks: undefined;
  Stats: undefined;
  Sync: undefined;
  DeckDetail: { deckId: number; deckName: string; deckKind: DeckKind };
  Preparation: { deckId: number; deckName: string; deckKind: DeckKind };
  Quiz: {
    deckId: number;
    deckName: string;
    deckKind: DeckKind;
    gameMode: GameMode;
    questionCount: number;
    durationMinutes: number;
  };
  Results: {
    deckName: string;
    gameMode: GameMode;
    score: number;
    total: number;
    points: number;
    durationMinutes: number;
    timeTakenSeconds: number;
    currentStreak: number;
    longestStreak: number;
    isNewStreakDay: boolean;
  };
};
