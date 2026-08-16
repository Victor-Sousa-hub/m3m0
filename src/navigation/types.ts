export type RootStackParamList = {
  Decks: undefined;
  DeckDetail: { deckId: number; deckName: string };
  Preparation: { deckId: number; deckName: string };
  Quiz: { deckId: number; deckName: string; durationMinutes: number };
  Results: { deckName: string; score: number; total: number };
};
