import { getDatabase } from './database';
import { QuestionSetInputSchema, type QuestionSetInput } from '../import/questionImportSchema';

/**
 * Single entry point for getting questions into the database, regardless of
 * where they came from. `raw` is validated against QuestionSetInputSchema
 * first, so a malformed source fails loudly here instead of producing
 * inconsistent rows the frontend has to defend against later.
 */
export async function importQuestionSet(raw: unknown): Promise<{ deckId: number }> {
  const data: QuestionSetInput = QuestionSetInputSchema.parse(raw);
  const db = await getDatabase();

  let deckId = -1;

  await db.withTransactionAsync(async () => {
    const deckResult = await db.runAsync(
      'INSERT INTO decks (name, exam_code) VALUES (?, ?)',
      data.deck.name,
      data.deck.examCode ?? null
    );
    deckId = deckResult.lastInsertRowId;

    for (const question of data.questions) {
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
  });

  return { deckId };
}
