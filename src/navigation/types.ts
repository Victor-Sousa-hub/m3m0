export type RootStackParamList = {
  Decks: undefined;
  DeckDetail: { deckId: number; deckName: string };
  Quiz: { deckId: number; deckName: string };
  Results: { deckName: string; score: number; total: number };
};
