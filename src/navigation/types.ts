export type RootStackParamList = {
  Decks: undefined;
  Stats: undefined;
  Sync: undefined;
  DeckDetail: { deckId: number; deckName: string };
  Preparation: { deckId: number; deckName: string };
  Quiz: { deckId: number; deckName: string; durationMinutes: number };
  Results: {
    deckName: string;
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
