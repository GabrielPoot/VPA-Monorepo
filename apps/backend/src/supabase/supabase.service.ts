import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private _anonClient!: SupabaseClient;
  private _serviceRoleClient!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseAnonKey =
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    this._anonClient = createClient(supabaseUrl, supabaseAnonKey);
    this._serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * The anon client should be used for user actions, passing their JWT
   * to respect RLS policies via createClient or passing headers.
   * Typically, we authenticate requests via AuthGuard and Supabase processes RLS.
   */
  get anonClient(): SupabaseClient {
    return this._anonClient;
  }

  /**
   * Generates an authenticated Supabase client for a specific user request.
   * This is crucial to enforce Row Level Security (RLS) policies.
   */
  getClientWithAuth(token: string): SupabaseClient {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseAnonKey =
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  /**
   * Bypass RLS. Use ONLY for admin logic or system actions (crons, webhooks).
   */
  get serviceRoleClient(): SupabaseClient {
    return this._serviceRoleClient;
  }
}
