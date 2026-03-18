/**
 * Placeholder para los tipos de base de datos de Supabase.
 * Este archivo será sobreescrito automáticamente por el CI/CD usando `supabase gen types typescript`
 * Requiere que se ejecute la migración primero.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: any; // Temporal hasta que Supabase gen types se ejecute
    }
    Views: {
      [key: string]: any;
    }
    Functions: {
      [key: string]: any;
    }
    Enums: {
      [key: string]: any;
    }
    CompositeTypes: {
      [key: string]: any;
    }
  }
}
