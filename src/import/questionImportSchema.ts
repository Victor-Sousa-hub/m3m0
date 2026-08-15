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
});

export const QuestionSetInputSchema = z.object({
  deck: DeckInputSchema,
  questions: z.array(QuestionInputSchema).min(1, 'At least one question is required'),
});

export type QuestionOptionInput = z.infer<typeof QuestionOptionInputSchema>;
export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type DeckInput = z.infer<typeof DeckInputSchema>;
export type QuestionSetInput = z.infer<typeof QuestionSetInputSchema>;
