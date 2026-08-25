---
name: import-questions
description: Turn a .md note, a directory of .md notes, or a raw .json export into a validated m3m0 question-import file and wire it into the app. Use whenever the user gives a file/folder path and asks to add, import, or extract new exam or key-concept questions.
---

# import-questions

m3m0 has exactly one supported way to get question data into the app:
`importQuestionSet()` (`src/db/importQuestions.ts`), which validates everything
against `QuestionSetInputSchema` (`src/import/questionImportSchema.ts`) before it
touches SQLite. This skill produces the JSON that schema expects — never write
question/option rows by hand, and never invent a second ingestion path.

## Step 1 — figure out the content type

There are exactly two shapes, driven by `deck.kind`:

**`exam`** (simulado/practice-test questions):
- `deck: { name, examCode?, kind: "exam" }`
- Each question: a full scenario/stem in `text`, an `explanation`, a `source` (optional),
  and 2+ `options` where 1 or more can be `isCorrect: true` (multi-answer allowed).
- Match the style already in `src/data/imports/mla-c01-practice-test-*.json` —
  realistic exam scenarios, plausible distractors, explanation justifying the
  correct answer(s).

**`key_concepts`** (fast concept-recall drill, see `src/data/imports/key-concepts-aws.json`):
- `deck: { name, kind: "key_concepts" }`
- Each question: the concept's name as `text` (e.g. `"Cross-validation"`), a
  1-2 sentence `explanation` summarizing it, `source` pointing at the origin note,
  and **exactly 4** `options` with **exactly 1** `isCorrect: true`.
- Distractors should be genuinely confusable neighbors (e.g. RTO vs RPO, SSE-S3 vs
  SSE-C vs SSE-KMS, bias vs variance) rather than random wrong answers — pull them
  from adjacent concepts in the same note set when possible.
- `QuestionSetInputSchema` enforces the 4-options/1-correct rule via a
  `superRefine` — if you get the shape wrong, validation will fail with a clear
  per-question error, not a silent bad import.

If the user doesn't say which type, infer it: a folder of short one-topic notes
(like `key-concepts/` or `aws-services/`) is `key_concepts`; a full scenario/question
dump (like a practice-test JSON or a "questions and answers" doc) is `exam`. Ask if
genuinely ambiguous.

## Step 2 — extract

- **Single `.md` file / directory of `.md` notes**: read every file. For
  `key_concepts`, one question per note (empty notes still get a question — fill
  the summary from general domain knowledge, but say so in `explanation` or flag it
  to the user, same as was done for the empty AWS Lex/QuickSight/Rekognition/EC2/data
  warehouse notes). For `exam`, each source doc becomes one or more scenario
  questions depending on how much content it holds.
- **`.json` export**: read it, remap into the canonical shape — don't assume the
  input already matches; field names, option ordering, or correctness flags may
  differ.

## Step 3 — write, register, validate

1. Write the result to `src/data/imports/<slug>.json` (kebab-case, descriptive —
   e.g. `key-concepts-networking.json`, `mla-c01-practice-test-4.json`).
2. Register it in **both** seed loaders (they're separate hardcoded arrays, both
   must be updated or the deck only shows up on one platform):
   - `src/db/importSeedData.ts` — add to `SEED_QUESTION_SETS`.
   - `src/data/deckRepository.web.ts` — add to `SEED_SETS`.
3. Run `npx tsx scripts/validateImports.ts` — it parses every file in
   `src/data/imports/` against `QuestionSetInputSchema` and prints per-deck
   question counts (and multi-answer counts for exam decks). Fix any reported
   validation errors before finishing.
4. Run `npx tsc --noEmit` to confirm nothing else broke.

Don't touch `src/db/schema.ts`, `src/db/database.ts`, or `src/quiz/gameModes.ts` for
a routine content add — those only change if a genuinely new deck *kind* or pacing
rule is being introduced, not for adding more questions to an existing kind.
