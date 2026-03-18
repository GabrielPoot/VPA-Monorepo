import { z } from 'zod';

/**
 * Schema para el endpoint POST /training/commitments
 */
export const CreateCommitmentSchema = z.object({
  routineId: z.string().uuid('Debe ser un UUID válido'),
  durationDays: z.union([
    z.literal(7),
    z.literal(14),
    z.literal(30),
    z.null()
  ], {
    errorMap: () => ({ message: 'durationDays debe ser 7, 14, 30 o null' })
  })
});

export type CreateCommitmentDto = z.infer<typeof CreateCommitmentSchema>;


export const ExerciseResultSubmitSchema = z.object({
  exerciseId: z.string().uuid('Debe ser un UUID válido'),
  score: z.number().nonnegative('El score no puede ser negativo'),
});

/**
 * Schema para el endpoint POST /training/submit-gallery
 */
export const SubmitGallerySchema = z.object({
  sessionId: z.string().uuid('Debe ser un UUID válido'),
  results: z.array(ExerciseResultSubmitSchema).min(1, 'Debe enviar al menos un resultado'),
});

export type SubmitGalleryDto = z.infer<typeof SubmitGallerySchema>;

/**
 * Schema para query params en GET /training/analytics
 */
export const AnalyticsQuerySchema = z.object({
  exerciseId: z.string().uuid('Debe ser un UUID válido').optional(),
  date: z.string().datetime({ message: 'Debe ser una fecha ISO válida' }).optional(),
  week: z.number().int().positive('La semana debe ser un entero positivo').optional(),
  startDate: z.string().datetime({ message: 'Debe ser una fecha ISO válida' }).optional(),
  endDate: z.string().datetime({ message: 'Debe ser una fecha ISO válida' }).optional(),
});

export type AnalyticsQueryDto = z.infer<typeof AnalyticsQuerySchema>;
