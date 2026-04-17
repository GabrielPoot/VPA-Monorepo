import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SessionSchedulerService {
  private readonly logger = new Logger(SessionSchedulerService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Corre cada hora ('0 * * * *'). 
   * Localiza sesiones que caducaron (fecha menor a HOY) y están IN_PROGRESS.
   * Las marca como FAILED, rompe las rachas e inyecta UX Notifications.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDailySessionSweep() {
    this.logger.log('Starting Sweep for Expired Sessions...');
    const client = this.supabase.serviceRoleClient;

    const todayUTC = new Date().toISOString().split('T')[0];

    // 1. Obtener todas las sesiones IN_PROGRESS anteriores a hoy
    const { data: expiredSessions, error: fetchError } = await client
      .from('daily_sessions')
      .select('id, user_id, commitment_id')
      .eq('session_status', 'IN_PROGRESS')
      .lt('date', todayUTC);

    if (fetchError || !expiredSessions || expiredSessions.length === 0) {
      this.logger.log('No expired sessions found to fail.');
      return;
    }

    this.logger.log(`Found ${expiredSessions.length} expired sessions. Failing them...`);

    // 2. Iterar sesiones. Lo ideal sería Bulk, pero manejamos la máquina de estados.
    for (const session of expiredSessions) {
      // Marcar Failed
      await client
        .from('daily_sessions')
        .update({
          session_status: 'FAILED',
        })
        .eq('id', session.id);

      // 3. Romper Streaks and Generate Notification
      await this.breakStreakAndNotify(client, session.user_id);
    }
    
    this.logger.log('Sweep completed.');
  }

  private async breakStreakAndNotify(client: any, userId: string) {
    // a. Obtener perfil
    const { data: profile } = await client
      .from('profiles')
      .select('current_streak')
      .eq('id', userId)
      .single();

    if (!profile) return;

    // Solo notificar si se perdió una racha activa (current_streak > 0)
    if (profile.current_streak > 0) {
      // b. Cerrar el streak_history marcándolo como 'broken'
      await client
        .from('streak_history')
        .update({
          ended_at: new Date().toISOString(),
          status: 'broken',
        })
        .eq('user_id', userId)
        .eq('status', 'active');
      
      // c. Crear Notification basada en UX Pattern
      const uxPayload = {
        type: 'STREAK_BROKEN',
        title: 'Racha interrumpida',
        message: 'Sabemos que fue un día difícil. Vuelve más fuerte mañana.',
        variant: 'warning'
      };

      await client
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'STREAK_ALERT',
          data: uxPayload,
        });
    }

    // d. Resetear la racha actual a 0 siempre (incluso si era 0 para estar seguros)
    await client
      .from('profiles')
      .update({ current_streak: 0 })
      .eq('id', userId);
  }
}
