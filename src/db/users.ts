import { getDatabase } from './database';
import type { User } from '../types/models';

/**
 * This app has no auth — a single local profile owns every saved score.
 * getCurrentUser() returns that profile (the earliest created row) or null
 * before onboarding has run.
 */
export async function getCurrentUser(): Promise<User | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<User>(
    'SELECT id, name, created_at as createdAt FROM users ORDER BY created_at ASC LIMIT 1'
  );
  return row ?? null;
}

export async function createUser(name: string): Promise<User> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Name is required');
  }
  const db = await getDatabase();
  const result = await db.runAsync('INSERT INTO users (name) VALUES (?)', trimmed);
  const user = await db.getFirstAsync<User>(
    'SELECT id, name, created_at as createdAt FROM users WHERE id = ?',
    result.lastInsertRowId
  );
  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
}
