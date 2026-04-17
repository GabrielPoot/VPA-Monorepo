import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GradingService } from '../grading/grading.service';
import { SessionService } from './session.service';
import { SubmitGalleryDto } from './dto/training.dto';

@Injectable()
export class ResultService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly grading: GradingService,
    private readonly sessionService: SessionService,
  ) {}

  async submitGalleryResult(userId: string, token: string, dto: SubmitGalleryDto) {
    const client = this.supabase.getClientWithAuth(token);
    const session = await this.sessionService.getTodaySession(userId, token);

    // Verify session matches
    if (session.id !== dto.sessionId) {
      throw new UnprocessableEntityException('Session ID mismatch with active session');
    }

    const insertedResults = [];

    // Process all results in the array
    for (const result of dto.results) {
      // 1. Fetch exercise to know metric_unit
      const { data: exercise } = await client
        .from('exercise_templates')
        .select('metric_unit')
        .eq('id', result.exerciseId)
        .single();
      
      const metric_unit = exercise ? exercise.metric_unit : 'score';

      // 2. Guard clauses 
      if (metric_unit === 'kills' && (result.score < 0 || result.score > 40)) {
        throw new UnprocessableEntityException('Kills must be between 0 and 40');
      }
      if (metric_unit === 'accuracy' && (result.score < 0 || result.score > 100)) {
        throw new UnprocessableEntityException('Accuracy must be between 0 and 100');
      }

      // 3. Obtain Grade
      const thresholdPass = metric_unit === 'accuracy' ? 70 : 15;
      const thresholdExc = metric_unit === 'accuracy' ? 90 : 30;

      const grade = this.grading.calculateGrade(
        result.score,
        thresholdPass,
        thresholdExc,
      );

      // 4. Save result
      const { data: record, error } = await client
        .from('gallery_results')
        .insert({
          session_id: session.id,
          exercise_id: result.exerciseId,
          score: result.score,
          metric_unit,
          grade,
        })
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      insertedResults.push(record);

      // 5. Generate coach tip if not EXCELLENT
      if (grade !== 'EXCELLENT') {
        await this.generateCoachTip(client, session.id, result.exerciseId, grade);
      }
    }

    // 6. Update session gallery status
    await client
      .from('daily_sessions')
      .update({ is_gallery_done: true })
      .eq('id', session.id);

    // 7. Try to auto-complete session if DM is also done
    if (session.is_dm_done) {
      await this.sessionService.markSessionCompleted(userId, session.id, token);
    }

    return insertedResults;
  }

  private async generateCoachTip(client: any, sessionId: string, exerciseId: string, grade: string) {
    const { data: randomTip } = await client
      .from('coach_tips_catalog')
      .select('*')
      .limit(1)
      .single();

    if (randomTip) {
      // Intentionally ignoring duplicate errors if already generated
      await client.from('coach_tips').insert({
        session_id: sessionId,
        catalog_id: randomTip.id,
      });
    }
  }
}
