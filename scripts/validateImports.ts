import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { QuestionSetInputSchema } from '../src/import/questionImportSchema';

const importsDir = join(__dirname, '..', 'src', 'data', 'imports');
const files = readdirSync(importsDir).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.error(`No .json files found in ${importsDir}`);
  process.exit(1);
}

let hadError = false;

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(importsDir, file), 'utf-8'));
  const result = QuestionSetInputSchema.safeParse(raw);

  if (!result.success) {
    hadError = true;
    console.error(`INVALID: ${file}`);
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    continue;
  }

  const { deck, questions } = result.data;
  const multiAnswerCount = questions.filter((q) => q.options.filter((o) => o.isCorrect).length > 1).length;
  console.log(
    `OK: ${file} -> deck "${deck.name}" (${deck.examCode ?? 'no exam code'}), ${questions.length} questions (${multiAnswerCount} multi-answer)`
  );
}

if (hadError) {
  process.exit(1);
}
