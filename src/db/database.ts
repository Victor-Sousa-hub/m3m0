import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

const DATABASE_NAME = 'm3m0.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(SCHEMA_SQL);
      return db;
    });
  }
  return dbPromise;
}
