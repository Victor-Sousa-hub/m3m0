import { QuestionSetInputSchema } from '../import/questionImportSchema';
import mlaC01PracticeTest1 from '../data/imports/mla-c01-practice-test-1.json';
import mlaC01PracticeTest2 from '../data/imports/mla-c01-practice-test-2.json';
import mlaC01PracticeTest3 from '../data/imports/mla-c01-practice-test-3.json';
import keyConceptsAws from '../data/imports/key-concepts-aws.json';
import type { Deck, Question, QuestionOption } from '../types/models';

/**
 * The PC build has no local database, so the seeded decks (the only decks
 * available there — custom decks are Android-only, see supportsCustomDecks)
 * are read straight from the same bundled JSON the native importer seeds
 * SQLite from, validated with the same schema, and assigned SQLite-like
 * sequential ids so the rest of the app (QuizScreen etc.) doesn't need to
 * know it's not talking to a database.
 */
const SEED_SETS: unknown[] = [
  mlaC01PracticeTest1,
  mlaC01PracticeTest2,
  mlaC01PracticeTest3,
  keyConceptsAws,
];

export const supportsCustomDecks = false;

interface Store {
  decks: Deck[];
  questionsByDeck: Map<number, Question[]>;
}

let cachedStore: Store | null = null;

function buildStore(): Store {
  const decks: Deck[] = [];
  const questionsByDeck = new Map<number, Question[]>();
  let nextQuestionId = 1;
  let nextOptionId = 1;
  const epoch = new Date(0).toISOString();

  SEED_SETS.forEach((raw, index) => {
    const parsed = QuestionSetInputSchema.parse(raw);
    const deckId = index + 1;
    decks.push({
      id: deckId,
      name: parsed.deck.name,
      examCode: parsed.deck.examCode ?? null,
      kind: parsed.deck.kind,
      createdAt: epoch,
    });

    const questions: Question[] = parsed.questions.map((question) => {
      const questionId = nextQuestionId++;
      const options: QuestionOption[] = question.options.map((option, orderIndex) => ({
        id: nextOptionId++,
        questionId,
        text: option.text,
        isCorrect: option.isCorrect,
        orderIndex,
      }));
      return {
        id: questionId,
        deckId,
        text: question.text,
        explanation: question.explanation ?? null,
        multipleAnswers: options.filter((o) => o.isCorrect).length > 1,
        source: question.source ?? null,
        createdAt: epoch,
        options,
      };
    });

    questionsByDeck.set(deckId, questions);
  });

  return { decks, questionsByDeck };
}

function getStore(): Store {
  if (!cachedStore) cachedStore = buildStore();
  return cachedStore;
}

export async function listDecks(): Promise<Deck[]> {
  return getStore().decks;
}

export async function createDeck(): Promise<void> {
  throw new Error('Criar baralhos personalizados só é suportado no app Android.');
}

export async function getQuestionsForDeck(deckId: number): Promise<Question[]> {
  return getStore().questionsByDeck.get(deckId) ?? [];
}

export async function getQuestionCountForDeck(deckId: number): Promise<number> {
  return (getStore().questionsByDeck.get(deckId) ?? []).length;
}
