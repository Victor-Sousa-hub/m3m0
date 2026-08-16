import { getDatabase } from './database';
import type { Question, QuestionOption } from '../types/models';

export async function getQuestionsForDeck(deckId: number): Promise<Question[]> {
  const db = await getDatabase();

  const questionRows = await db.getAllAsync<Omit<Question, 'options' | 'multipleAnswers'> & {
    multipleAnswers: number;
  }>(
    `SELECT id, deck_id as deckId, text, explanation, multiple_answers as multipleAnswers,
            source, created_at as createdAt
     FROM questions WHERE deck_id = ? ORDER BY id ASC`,
    deckId
  );

  const optionRows = await db.getAllAsync<Omit<QuestionOption, 'isCorrect'> & { isCorrect: number }>(
    `SELECT o.id, o.question_id as questionId, o.text, o.is_correct as isCorrect, o.order_index as orderIndex
     FROM options o
     JOIN questions q ON q.id = o.question_id
     WHERE q.deck_id = ?
     ORDER BY o.question_id ASC, o.order_index ASC`,
    deckId
  );

  const optionsByQuestion = new Map<number, QuestionOption[]>();
  for (const row of optionRows) {
    const option: QuestionOption = { ...row, isCorrect: !!row.isCorrect };
    const list = optionsByQuestion.get(option.questionId) ?? [];
    list.push(option);
    optionsByQuestion.set(option.questionId, list);
  }

  return questionRows.map((row) => ({
    ...row,
    multipleAnswers: !!row.multipleAnswers,
    options: optionsByQuestion.get(row.id) ?? [],
  }));
}

export async function getQuestionCountForDeck(deckId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM questions WHERE deck_id = ?',
    deckId
  );
  return row?.count ?? 0;
}
