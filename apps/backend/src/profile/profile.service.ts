import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './profile.controller';

@Injectable()
export class ProfileService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfile(userId: string, token: string) {
    const client = this.supabase.getClientWithAuth(token);
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return {
       message: 'Profile fetched successfully',
       profile: data
    };
  }

  async updateProfile(userId: string, token: string, dto: UpdateProfileDto) {
    const client = this.supabase.getClientWithAuth(token);
    const { data, error } = await client
      .from('profiles')
      .update(dto)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return {
       message: 'Profile updated successfully',
       profile: data
    };
  }
}
