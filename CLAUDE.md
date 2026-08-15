# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Product goal

This is not a generic flashcard app. **m3m0's purpose is to help the user pass AWS
certification exams** by simulating real exam questions (single- and multiple-answer,
multiple choice) as a game. Every feature decision should be evaluated against that
goal — the flashcard-style `Deck`/`Question` naming is just the data model, the product
is an AWS exam simulator.

## Working conventions

- **Always version.** Commit changes as they land instead of letting work pile up
  uncommitted — this repo should stay in a state where `git log` reflects real
  incremental progress.
- **Question data has many possible origins** (manual entry, JSON exports, scrapers,
  future APIs) and must always be safely consumable by the frontend, regardless of
  source. All ingestion goes through `importQuestionSet()` in `src/db/importQuestions.ts`,
  which validates untrusted input against `QuestionSetInputSchema`
  (`src/import/questionImportSchema.ts`) before anything touches SQLite. Never insert
  question/option rows outside that path — screens should never have to defend against
  inconsistent question shapes.

## Commands

- `npm start` / `npm run android` — start Metro / launch on Android (emulator or device)
- `npx tsc --noEmit` — type-check the whole project
- `npx expo export --platform android` — validate that the Android bundle compiles
  (useful as a smoke test when there's no emulator handy)

## Architecture

- **`App.tsx`** — opens/migrates the SQLite database (`getDatabase()`) before rendering
  `RootNavigator`; shows a spinner until the DB is ready.
- **`src/db/schema.ts`** — raw SQL DDL for `decks`, `questions`, `options`. A deck groups
  questions (e.g. by exam or topic); a question has N options, each optionally flagged
  `is_correct` (more than one correct option = multiple-answer question).
- **`src/db/database.ts`** — single lazily-created `SQLiteDatabase` connection; runs
  `SCHEMA_SQL` on first open.
- **`src/db/importQuestions.ts`** — the only supported write path for question data.
  Validates with `QuestionSetInputSchema`, then inserts deck → questions → options
  inside one `withTransactionAsync` call.
- **`src/import/questionImportSchema.ts`** — Zod schema defining the canonical shape
  any question source must be normalized into (`{ deck, questions: [{ text,
  explanation?, source?, options: [{ text, isCorrect }] }] }`). This is the contract
  new importers (manual UI, file import, future scraping) must produce.
- **`src/types/models.ts`** — `Deck` / `Question` / `QuestionOption` — the shape data
  takes once read back out of SQLite (camelCase, booleans instead of 0/1).
- **`src/navigation/`** — one native-stack: `Decks` (list/create decks) →
  `DeckDetail` (per-deck view, currently a placeholder — the exam-simulation game
  screen lands here).
- **`src/screens/`** — `DecksScreen` is the only screen wired to the database so far;
  `DeckDetailScreen` is a stub pending the actual quiz/game UI.
