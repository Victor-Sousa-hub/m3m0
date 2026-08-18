import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

const DATABASE_NAME = 'm3m0.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * SCHEMA_SQL only creates tables that don't exist yet, so databases created
 * before a column was added (e.g. the seeded backup) need it added by hand.
 */
async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (columns.some((c) => c.name === column)) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

/** Local calendar date N days before `dateStr`, mirroring getLocalDateString's non-UTC convention. */
function shiftDateString(dateStr: string, deltaDays: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + deltaDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pre-sync databases only ever stored the latest last_active_date plus a
 * running counter, never the full history active_days now relies on. This
 * reconstructs a plausible run of `current_streak` consecutive days ending
 * at last_active_date so the streak shown today doesn't drop after upgrade;
 * longest_streak is kept separately as a floor in getUserStreak since its
 * exact dates can't be recovered.
 */
async function backfillActiveDaysFromLegacyStreak(db: SQLite.SQLiteDatabase): Promise<void> {
  const activeDaysCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM active_days'
  );
  if ((activeDaysCount?.count ?? 0) > 0) return;

  const legacy = await db.getFirstAsync<{ lastActiveDate: string | null; currentStreak: number }>(
    'SELECT last_active_date as lastActiveDate, current_streak as currentStreak FROM users ORDER BY created_at ASC LIMIT 1'
  );
  if (!legacy?.lastActiveDate) return;

  const days = Math.max(1, legacy.currentStreak || 1);
  for (let i = 0; i < days; i += 1) {
    const date = shiftDateString(legacy.lastActiveDate, -i);
    await db.runAsync('INSERT OR IGNORE INTO active_days (date, synced) VALUES (?, 0)', date);
  }
}

async function backfillAttemptClientIds(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    "UPDATE quiz_attempts SET client_id = lower(hex(randomblob(16))) WHERE client_id IS NULL"
  );
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'users', 'current_streak', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'users', 'longest_streak', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'users', 'last_active_date', 'TEXT');
  await addColumnIfMissing(db, 'quiz_attempts', 'duration_minutes', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'quiz_attempts', 'time_taken_seconds', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'quiz_attempts', 'points', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'quiz_attempts', 'client_id', 'TEXT');
  await addColumnIfMissing(db, 'quiz_attempts', 'synced', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'quiz_attempts', 'game_mode', "TEXT NOT NULL DEFAULT 'thinking'");
  await backfillAttemptClientIds(db);
  await backfillActiveDaysFromLegacyStreak(db);
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(SCHEMA_SQL);
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}
