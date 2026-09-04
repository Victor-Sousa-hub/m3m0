import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from './database';
import { QuestionSetInputSchema, type QuestionInput, type QuestionSetInput } from '../import/questionImportSchema';

async function insertQuestions(
  db: SQLiteDatabase,
  deckId: number,
  questions: QuestionInput[]
): Promise<void> {
  for (const question of questions) {
    const correctCount = question.options.filter((option) => option.isCorrect).length;

    const questionResult = await db.runAsync(
      'INSERT INTO questions (deck_id, text, explanation, multiple_answers, source) VALUES (?, ?, ?, ?, ?)',
      deckId,
      question.text,
      question.explanation ?? null,
      correctCount > 1 ? 1 : 0,
      question.source ?? null
    );
    const questionId = questionResult.lastInsertRowId;

    for (let index = 0; index < question.options.length; index += 1) {
      const option = question.options[index];
      await db.runAsync(
        'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
        questionId,
        option.text,
        option.isCorrect ? 1 : 0,
        index
      );
    }
  }
}

/**
 * Single entry point for getting questions into the database, regardless of
 * where they came from. `raw` is validated against QuestionSetInputSchema
 * first, so a malformed source fails loudly here instead of producing
 * inconsistent rows the frontend has to defend against later. Always creates
 * a brand new deck — for refreshing the content of a deck that may already
 * exist (bundled seed data), use `syncSeedQuestionSet` instead.
 */
export async function importQuestionSet(raw: unknown): Promise<{ deckId: number }> {
  const data: QuestionSetInput = QuestionSetInputSchema.parse(raw);
  const db = await getDatabase();

  let deckId = -1;

  await db.withTransactionAsync(async () => {
    const deckResult = await db.runAsync(
      'INSERT INTO decks (name, exam_code, kind) VALUES (?, ?, ?)',
      data.deck.name,
      data.deck.examCode ?? null,
      data.deck.kind
    );
    deckId = deckResult.lastInsertRowId;
    await insertQuestions(db, deckId, data.questions);
  });

  return { deckId };
}

/**
 * Used for bundled seed data only. Keeps the deck row (and its id) stable so
 * `quiz_attempts.deck_id` never dangles, and only touches `questions`/
 * `options` — never `users`, `quiz_attempts`, `active_days`, or `sync_state`.
 * That means updating a seeded deck's content can never cost the user their
 * streak, history, or pairing, and never requires clearing app data.
 */
export async function syncSeedQuestionSet(raw: unknown): Promise<{ deckId: number; refreshed: boolean }> {
  const data: QuestionSetInput = QuestionSetInputSchema.parse(raw);
  const db = await getDatabase();

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM decks WHERE name = ?',
    data.deck.name
  );

  if (!existing) {
    const { deckId } = await importQuestionSet(raw);
    return { deckId, refreshed: false };
  }

  const current = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM questions WHERE deck_id = ?',
    existing.id
  );
  if ((current?.count ?? 0) === data.questions.length) {
    return { deckId: existing.id, refreshed: false };
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM questions WHERE deck_id = ?', existing.id);
    await insertQuestions(db, existing.id, data.questions);
  });

  return { deckId: existing.id, refreshed: true };
}
