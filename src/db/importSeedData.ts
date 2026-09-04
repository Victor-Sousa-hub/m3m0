import { syncSeedQuestionSet } from './importQuestions';
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
 * Bundled seed data (personal AWS exam practice sets), safe to call on every
 * launch: new decks get created once, and an existing deck whose bundled
 * question count has changed gets its questions/options replaced in place
 * (see syncSeedQuestionSet) — never touching users, quiz_attempts,
 * active_days, or sync_state, so a content update can never cost the user
 * their streak, history, or device pairing.
 */
export async function importSeedQuestionSets(): Promise<void> {
  for (const raw of SEED_QUESTION_SETS) {
    await syncSeedQuestionSet(raw);
  }
}
