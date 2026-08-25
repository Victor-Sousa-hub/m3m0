import { z } from 'zod';

/**
 * Canonical shape every question source (manual entry, JSON export, scraper,
 * future API) must be normalized into before it reaches the database. This
 * is the single contract the frontend can always rely on — no screen should
 * ever branch on "where did this question come from".
 */
export const QuestionOptionInputSchema = z.object({
  text: z.string().trim().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

export const QuestionInputSchema = z
  .object({
    text: z.string().trim().min(1, 'Question text is required'),
    explanation: z.string().trim().min(1).optional(),
    source: z.string().trim().min(1).optional(),
    options: z.array(QuestionOptionInputSchema).min(2, 'At least 2 options are required'),
  })
  .refine((question) => question.options.some((option) => option.isCorrect), {
    message: 'At least one option must be marked as correct',
    path: ['options'],
  });

export const DeckInputSchema = z.object({
  name: z.string().trim().min(1, 'Deck name is required'),
  examCode: z.string().trim().min(1).optional(),
  /** 'exam' = practice-test questions, any option count, multi-answer allowed. 'key_concepts' = concept-name prompt with exactly 4 options/1 correct, see the refinement below. */
  kind: z.enum(['exam', 'key_concepts']).default('exam'),
});

export const QuestionSetInputSchema = z
  .object({
    deck: DeckInputSchema,
    questions: z.array(QuestionInputSchema).min(1, 'At least one question is required'),
  })
  .superRefine((data, ctx) => {
    if (data.deck.kind !== 'key_concepts') return;

    data.questions.forEach((question, index) => {
      if (question.options.length !== 4) {
        ctx.addIssue({
          code: 'custom',
          message: 'key_concepts questions must have exactly 4 options',
          path: ['questions', index, 'options'],
        });
      }
      const correctCount = question.options.filter((option) => option.isCorrect).length;
      if (correctCount !== 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'key_concepts questions must have exactly 1 correct option',
          path: ['questions', index, 'options'],
        });
      }
    });
  });

export type QuestionOptionInput = z.infer<typeof QuestionOptionInputSchema>;
export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type DeckInput = z.infer<typeof DeckInputSchema>;
export type QuestionSetInput = z.infer<typeof QuestionSetInputSchema>;
