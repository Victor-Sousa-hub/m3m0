CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  pairing_code TEXT UNIQUE,
  pairing_code_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per paired device: /pair/start and /pair/join both mint a fresh
-- secret for the calling device and add it here, so N devices can share one
-- account without the server ever needing to re-emit an earlier secret
-- (which it couldn't, since only the hash is stored).
CREATE TABLE account_secrets (
  secret_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE active_days (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  PRIMARY KEY (account_id, date)
);

CREATE TABLE quiz_attempts (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  deck_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  points INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (account_id, client_id)
);

CREATE INDEX idx_account_secrets_account ON account_secrets(account_id);
CREATE INDEX idx_active_days_account ON active_days(account_id);
CREATE INDEX idx_quiz_attempts_account ON quiz_attempts(account_id);
