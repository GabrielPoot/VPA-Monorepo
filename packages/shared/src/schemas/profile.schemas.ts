import { z } from 'zod';

/**
 * Schema para el endpoint PATCH /profile
 * Nota: Req 2.4 de task.md y REQ-3.3 specifies constraints
 */
export const UpdateProfileSchema = z.object({
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres').max(20, 'El username no puede exceder 20 caracteres').optional(),
  bio: z.string().max(500, 'La bio no puede exceder 500 caracteres').optional(),
  timezone: z.string()
    .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Debe ser una zona horaria IANA válida (ej. America/New_York)')
    .optional(),
  privacyMode: z.boolean().optional(),
  title: z.string().uuid('Debe ser un UUID válido').optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
