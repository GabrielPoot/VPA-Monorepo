import { z } from 'zod';

/**
 * Standard Schema for any paginated request query string
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

/**
 * Schema para el endpoint GET /social/search
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(3, 'La búsqueda debe tener al menos 3 caracteres'),
}).merge(PaginationSchema); // Extending pagination standard implicitly

export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
