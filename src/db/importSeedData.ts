import type { SQLiteDatabase } from 'expo-sqlite';
import { importQuestionSet } from './importQuestions';
import mlaC01PracticeTest1 from '../data/imports/mla-c01-practice-test-1.json';
import mlaC01PracticeTest2 from '../data/imports/mla-c01-practice-test-2.json';
import mlaC01PracticeTest3 from '../data/imports/mla-c01-practice-test-3.json';
import keyConceptsAws from '../data/imports/key-concepts-aws.json';
import awsServicesKeyConcepts from '../data/imports/aws-services-key-concepts.json';
import mlAlgorithmsKeyConcepts from '../data/imports/ml-algorithms-key-concepts.json';
import sagemakerKeyConcepts from '../data/imports/sagemaker-key-concepts.json';

const SEED_QUESTION_SETS: unknown[] = [
  mlaC01PracticeTest1,
  mlaC01PracticeTest2,
  mlaC01PracticeTest3,
  keyConceptsAws,
  awsServicesKeyConcepts,
  mlAlgorithmsKeyConcepts,
  sagemakerKeyConcepts,
];

/**
 * One-time bundled seed data (personal AWS exam practice sets). Skips any
 * deck whose name already exists so this is safe to call on every launch.
 */
export async function importSeedQuestionSets(db: SQLiteDatabase): Promise<void> {
  for (const raw of SEED_QUESTION_SETS) {
    const deckName = (raw as { deck?: { name?: string } }).deck?.name;
    if (!deckName) continue;

    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM decks WHERE name = ? LIMIT 1',
      deckName
    );
    if (existing) continue;

    await importQuestionSet(raw);
  }
}
