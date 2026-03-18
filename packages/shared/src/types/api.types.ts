/**
 * Interfaces genéricas para la API de VPA
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Interface estandarizada para todos los errores HTTP de VPA
 * Diseñada para soportar tanto HttpExceptions nest como errores de validación Zod
 */
export interface ErrorResponse {
  statusCode: number;      // ej. 400, 401, 404, 422, 500
  message: string;         // Mensaje amigable (ej. "Validation failed", "Not Found")
  error: string;           // ej. "Bad Request", "Unprocessable Entity"
  timestamp: string;       // ISO timestamp
  path: string;            // Ruta que generó el error
  details?: Record<string, string>; // Errores clave-valor específicos (ideal para Zod)
}
