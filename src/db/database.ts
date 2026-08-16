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

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'users', 'current_streak', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'users', 'longest_streak', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'users', 'last_active_date', 'TEXT');
  await addColumnIfMissing(db, 'quiz_attempts', 'duration_minutes', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'quiz_attempts', 'time_taken_seconds', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'quiz_attempts', 'points', 'INTEGER NOT NULL DEFAULT 0');
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
