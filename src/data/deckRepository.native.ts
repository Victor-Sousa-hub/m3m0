import { getDatabase } from '../db/database';
import { getQuestionCountForDeck, getQuestionsForDeck } from '../db/questions';
import type { Deck } from '../types/models';

export const supportsCustomDecks = true;

export async function listDecks(): Promise<Deck[]> {
  const db = await getDatabase();
  return db.getAllAsync<Deck>(
    'SELECT id, name, exam_code as examCode, kind, created_at as createdAt FROM decks ORDER BY created_at DESC'
  );
}

export async function createDeck(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO decks (name) VALUES (?)', name);
}

export { getQuestionCountForDeck, getQuestionsForDeck };
