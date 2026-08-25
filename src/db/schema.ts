export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  exam_code TEXT,
  kind TEXT NOT NULL DEFAULT 'exam',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY NOT NULL,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  explanation TEXT,
  multiple_answers INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  client_id TEXT,
  synced INTEGER NOT NULL DEFAULT 0,
  game_mode TEXT NOT NULL DEFAULT 'thinking'
);

/** Every locally-active calendar date, the source of truth streaks are computed from (see src/sync/streakMath.ts). */
CREATE TABLE IF NOT EXISTS active_days (
  date TEXT PRIMARY KEY NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);

/** Singleton (id always 1): the device's pairing state with the sync backend. */
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  account_id TEXT,
  sync_secret TEXT,
  paired_at TEXT,
  last_synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_deck_id ON questions(deck_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_deck_id ON quiz_attempts(deck_id);
`;
