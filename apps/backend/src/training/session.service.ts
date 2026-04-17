import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SessionService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Fetches or creates today's session based on UTC Date.
   */
  async getTodaySession(userId: string, token: string) {
    const client = this.supabase.getClientWithAuth(token);

    // 1. Get active commitment
    const { data: commitment } = await client
      .from('user_commitments')
      .select('id, routine_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!commitment) {
      throw new NotFoundException('No active commitment found.');
    }

    // Get today's local YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // 2. Look for today's session
    let { data: session } = await client
      .from('daily_sessions')
      .select('*')
      .eq('commitment_id', commitment.id)
      .eq('date', today)
      .single();

    // 3. Create if not exists
    if (!session) {
      const { data: newSession, error } = await client
        .from('daily_sessions')
        .insert({
          user_id: userId,
          commitment_id: commitment.id,
          date: today,
          session_status: 'IN_PROGRESS',
          is_gallery_done: false,
          is_dm_done: false,
        })
        .select()
        .single();
      
      if (error) {
        throw new InternalServerErrorException(error.message);
      }
      session = newSession;
    }

    return session;
  }

  /**
   * Completes a session, increments streak, updates streak history,
   * unblocks titles if necessary.
   */
  async markSessionCompleted(userId: string, sessionId: string, token: string) {
    const client = this.supabase.getClientWithAuth(token);

    const { data: session, error } = await client
      .from('daily_sessions')
      .update({
        session_status: 'COMPLETED',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('session_status', 'IN_PROGRESS') // Must be in progress
      .select()
      .single();

    if (error || !session) return; // Might already be completed

    // Streak Logic via Service Role to bypass RLS limits on complex operations or do it locally
    const { data: profile } = await client
      .from('profiles')
      .select('current_streak, max_streak')
      .eq('id', userId)
      .single();

    if (profile) {
      const newStreak = (profile.current_streak || 0) + 1;
      const newMax = Math.max(newStreak, profile.max_streak || 0);

      await client
        .from('profiles')
        .update({
          current_streak: newStreak,
          max_streak: newMax
        })
        .eq('id', userId);

      // Add to streak_history
      await client
        .from('streak_history')
        .insert({
          user_id: userId,
          streak_length: newStreak,
          ended_at: null // It's ongoing
        });
        
      // Future: Title unlocking logic can be hooked here
    }
  }
}
