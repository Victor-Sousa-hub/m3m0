export interface Deck {
  id: number;
  name: string;
  examCode: string | null;
  createdAt: string;
}

export interface QuestionOption {
  id: number;
  questionId: number;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface Question {
  id: number;
  deckId: number;
  text: string;
  explanation: string | null;
  multipleAnswers: boolean;
  source: string | null;
  createdAt: string;
  options: QuestionOption[];
}
