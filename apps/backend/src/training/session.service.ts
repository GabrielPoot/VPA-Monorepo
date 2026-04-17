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

      // Add to streak_history or Update existing
      // First check if active exists
      const { data: activeStreak } = await client
        .from('streak_history')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (activeStreak) {
        await client
          .from('streak_history')
          .update({ streak_value: newStreak })
          .eq('id', activeStreak.id);
      } else {
        await client
          .from('streak_history')
          .insert({
            user_id: userId,
            streak_value: newStreak,
            started_at: new Date().toISOString(),
          });
      }
        
      // Title unlocking logic
      await this.handleTitleUnlocks(client, userId, newStreak, newMax);
    }
  }

  /**
   * Verifica los títulos bloqueados y su condición SESSIONS_COMPLETED o STREAK_REACHED.
   * Si se cumple, lo desbloquea e inyecta la UX Notification respectiva.
   */
  private async handleTitleUnlocks(client: any, userId: string, currentStreak: number, maxStreak: number) {
    // 1. Obtener todos los títulos existentes que este usuario NO tenga
    const { data: unlockedTitles } = await client
      .from('user_titles')
      .select('title_id')
      .eq('user_id', userId);

    const unlockedSet = new Set((unlockedTitles || []).map((t: any) => t.title_id));

    const { data: allTitles } = await client
      .from('unlockable_titles')
      .select('*');

    const pendingTitles = (allTitles || []).filter((t: any) => !unlockedSet.has(t.id));

    // 2. Evaluar condiciones
    for (const title of pendingTitles) {
      let isUnlocked = false;

      // STREAK_REACHED
      if (title.unlock_condition_type === 'STREAK_REACHED') {
        if (maxStreak >= title.unlock_condition_value) isUnlocked = true;
      }
      // SESSIONS_COMPLETED (en retrospectiva real consultaría el count en bdd)
      // Acá simplificado a SESSIONS_COMPLETED si max_streak >= ... solo como scaffolding.
      else if (title.unlock_condition_type === 'SESSIONS_COMPLETED') {
        // ... (Para SESSIONS_COMPLETED tendríamos que contar los COMPLETED en daily_sessions)
        const { count } = await client
          .from('daily_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('session_status', 'COMPLETED');
        
        if (count && count >= title.unlock_condition_value) isUnlocked = true;
      }

      // 3. Desbloquear y Notificar
      if (isUnlocked) {
        await client
          .from('user_titles')
          .insert({
            user_id: userId,
            title_id: title.id,
          });

        const uxPayload = {
          type: 'TITLE_UNLOCKED',
          title: `¡Nuevo Título: ${title.name}!`,
          message: title.description || '¡Sigue entrenando para más recompensas!',
          variant: 'success',
          metadata: { title_id: title.id }
        };

        await client
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'COACH_TIP',
            data: uxPayload,
          });
      }
    }
  }
}
