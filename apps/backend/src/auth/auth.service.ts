import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto, LoginDto, VerifyRiotDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    // Use anon client for registration (Supabase handles it nicely)
    // The db trigger on_auth_user_created will intercept this and create the profile
    const { data, error } = await this.supabase.anonClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Registration successful',
      user: data.user,
      session: data.session,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const { data, error } =
      await this.supabase.anonClient.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Fetch profile
    const token = data.session.access_token;
    const userClient = this.supabase.getClientWithAuth(token);
    const { data: profile } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      message: 'Login successful',
      session: data.session,
      profile,
    };
  }

  async verifyRiot(userId: string, token: string, dto: VerifyRiotDto) {
    // 1. Mock de Riot API (A ser reemplazado por Riot Proxy Module)
    // Supongamos que pasamos la validación
    const mockedRiotPuuid = 'mocked-puuid-12345';

    // 2. Actualizar perfil usando RLS
    const client = this.supabase.getClientWithAuth(token);
    
    const { data, error } = await client
      .from('profiles')
      .update({
        riot_id: dto.riotId,
        riot_tag: dto.riotTag,
        region: dto.region,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return data;
  }

  async unlinkRiot(userId: string, token: string) {
    const client = this.supabase.getClientWithAuth(token);
    
    const { data, error } = await client
      .from('profiles')
      .update({
        riot_id: null,
        riot_tag: null,
        region: null,
        last_sync_at: null,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return data;
  }
}
