import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { SCHEMA_SQL } from '../src/db/schema';
import { QuestionSetInputSchema, type QuestionSetInput } from '../src/import/questionImportSchema';

const importsDir = join(__dirname, '..', 'src', 'data', 'imports');
const outputDir = join(__dirname, '..', 'backups');
const outputPath = join(outputDir, 'm3m0-seed.sqlite');

const SEED_FILES = [
  'mla-c01-practice-test-1.json',
  'mla-c01-practice-test-2.json',
  'mla-c01-practice-test-3.json',
];

mkdirSync(outputDir, { recursive: true });
if (existsSync(outputPath)) rmSync(outputPath);

const db = new DatabaseSync(outputPath);
db.exec(SCHEMA_SQL);

for (const file of SEED_FILES) {
  const raw = JSON.parse(readFileSync(join(importsDir, file), 'utf-8'));
  const data: QuestionSetInput = QuestionSetInputSchema.parse(raw);

  const deckResult = db
    .prepare('INSERT INTO decks (name, exam_code) VALUES (?, ?)')
    .run(data.deck.name, data.deck.examCode ?? null);
  const deckId = deckResult.lastInsertRowid;

  for (const question of data.questions) {
    const correctCount = question.options.filter((option) => option.isCorrect).length;

    const questionResult = db
      .prepare(
        'INSERT INTO questions (deck_id, text, explanation, multiple_answers, source) VALUES (?, ?, ?, ?, ?)'
      )
      .run(
        deckId,
        question.text,
        question.explanation ?? null,
        correctCount > 1 ? 1 : 0,
        question.source ?? null
      );
    const questionId = questionResult.lastInsertRowid;

    question.options.forEach((option, index) => {
      db.prepare(
        'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)'
      ).run(questionId, option.text, option.isCorrect ? 1 : 0, index);
    });
  }

  console.log(`Seeded "${data.deck.name}" (${data.questions.length} questions) -> deck id ${deckId}`);
}

db.close();
console.log(`Backup written to ${outputPath}`);
