import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAnalyticsSummary(userId: string, token: string) {
    const client = this.supabase.getClientWithAuth(token);

    // Fetch commitments to get all associated sessions
    const { data: commitments } = await client
      .from('user_commitments')
      .select(`
        id,
        daily_sessions (
          id, session_status, completed_at,
          exercise_results ( grade, score )
        )
      `)
      .eq('user_id', userId);

    if (!commitments) {
      throw new InternalServerErrorException('Failed to load analytics');
    }

    let totalSessions = 0;
    let completedSessions = 0;
    let failedSessions = 0;
    let gradesDist: Record<string, number> = { EXCELLENT: 0, PASSABLE: 0, BAD: 0 };
    
    commitments.forEach(c => {
      totalSessions += c.daily_sessions.length;
      c.daily_sessions.forEach((s: any) => {
        if (s.session_status === 'COMPLETED') completedSessions++;
        if (s.session_status === 'FAILED') failedSessions++;

        s.exercise_results.forEach((r: any) => {
          if (r.grade) gradesDist[r.grade] = (gradesDist[r.grade] || 0) + 1;
        });
      });
    });

    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const trend = completionRate > 50 ? 'improving' : 'declining';

    return {
      totalSessions,
      completedSessions,
      failedSessions,
      completionRate,
      trend,
      gradesDistribution: gradesDist
    };
  }
}
