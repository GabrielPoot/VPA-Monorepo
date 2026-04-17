import {
  Injectable,
  UnprocessableEntityException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CommitmentService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Creates a new commitment for a user. Validates that no active commitment exists.
   */
  async createCommitment(
    userId: string,
    token: string,
    routineId: string,
    durationDays: number | null,
  ) {
    const client = this.supabase.getClientWithAuth(token);

    // 1. Check for existing active commitment
    const { data: activeCommits } = await client
      .from('user_commitments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (activeCommits && activeCommits.length > 0) {
      throw new UnprocessableEntityException(
        'User already has an active commitment. Drop it or complete it first.',
      );
    }

    // 2. Fetch routine to calculate duration if needed
    // Assuming routine has duration
    const { data: routine } = await client
      .from('routine_templates')
      .select('*')
      .eq('id', routineId)
      .single();

    if (!routine) {
      throw new NotFoundException('Routine not found.');
    }

    // 3. Create commitment
    const { data, error } = await client
      .from('user_commitments')
      .insert({
        user_id: userId,
        routine_id: routineId,
        status: 'active',
        started_at: new Date().toISOString(),
        duration_days: durationDays || routine.duration_days,
        completed_days: 0,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return data;
  }

  /**
   * Drops an active commitment, failing any IN_PROGRESS daily session
   */
  async dropCommitment(userId: string, token: string, commitmentId: string) {
    const client = this.supabase.getClientWithAuth(token);

    // Update commitment status
    const { data, error } = await client
      .from('user_commitments')
      .update({ status: 'dropped' })
      .eq('id', commitmentId)
      .eq('user_id', userId) // RLS handles this, but double check is good
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      throw new UnprocessableEntityException('Unable to drop this commitment.');
    }

    // Fail all in_progress sessions tied to it
    const { error: sessionError } = await client
      .from('daily_sessions')
      .update({ session_status: 'FAILED', completed_at: new Date().toISOString() })
      .eq('commitment_id', commitmentId)
      .eq('session_status', 'IN_PROGRESS');

    if (sessionError) {
      console.error('Failed to update sessions on drop:', sessionError);
    }

    return data;
  }

  /**
   * Retrieves all commitments (active/dropped/completed)
   */
  async getCommitments(userId: string, token: string) {
    const client = this.supabase.getClientWithAuth(token);
    const { data, error } = await client
      .from('user_commitments')
      .select(`
        *,
        routine_templates!inner(name, description)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /**
   * Auto-completes the commitment if completed_days reaches duration_days
   * This is typically called by a cron job or session completion hook.
   */
  async tryAutoComplete(commitmentId: string, currentDays: number, durationDays: number | null, client: any) {
    if (durationDays !== null && currentDays >= durationDays) {
      await client
        .from('user_commitments')
        .update({ status: 'completed' })
        .eq('id', commitmentId);
      return true;
    }
    return false;
  }
}
