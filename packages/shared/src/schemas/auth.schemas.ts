import { z } from 'zod';
import { Region } from '../enums/region.enum';

/**
 * Schema para el endpoint POST /auth/register
 */
export const RegisterSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres').max(20, 'El username no puede exceder 20 caracteres'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

/**
 * Schema para el endpoint POST /auth/login
 */
export const LoginSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

/**
 * Schema para el endpoint POST /auth/verify-riot
 */
export const VerifyRiotSchema = z.object({
  riotId: z.string().min(1, 'El Riot ID es obligatorio'),
  riotTag: z.string().min(1, 'El Riot Tag es obligatorio'),
  region: z.nativeEnum(Region, {
    errorMap: () => ({ message: 'Debe ser una región válida (na, latam, eu, ap, kr)' }),
  }),
});

export type VerifyRiotDto = z.infer<typeof VerifyRiotSchema>;
