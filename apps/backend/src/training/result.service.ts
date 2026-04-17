import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GradingService } from '../grading/grading.service';
import { SessionService } from './session.service';
import { SubmitGalleryDto } from './dto/training.dto';
import { RiotMatchService } from '../riot/riot-match.service';

@Injectable()
export class ResultService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly grading: GradingService,
    private readonly sessionService: SessionService,
    private readonly riotMatchService: RiotMatchService,
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
        .from('exercise_results')
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

  /**
   * Sincroniza las partidas jugadas en DM mediante Riot API.
   * Filtra las iteraciones pasadas, inyecta scores al grading engine
   * y cierra el módulo del is_dm_done
   */
  async syncDeathmatch(userId: string, token: string) {
    const client = this.supabase.getClientWithAuth(token);
    const session = await this.sessionService.getTodaySession(userId, token);

    // 1. Obtener perfil
    const { data: profile } = await client
      .from('profiles')
      .select('puuid, region')
      .eq('id', userId)
      .single();

    if (!profile || !profile.puuid) {
      throw new UnprocessableEntityException('El usuario no tiene una cuenta de Riot vinculada o PUUID válido');
    }

    // 2. Fetch matches reales de la API
    const dmMatches = await this.riotMatchService.getDeathmatchMatches(profile.puuid, profile.region || 'na1');

    if (dmMatches.length === 0) {
      return { synced: 0, results: [], session };
    }

    // 3. Extraer IDs de Match para buscar duplicados
    const newMatchIds = dmMatches.map(m => m.matchId);

    // TODO: Ajustar esta tabla para depender de un ejercicio de DM dedicado ('gallery_results' la utilizamos como 'exercise_results' general)
    const { data: existingRecords } = await client
      .from('exercise_results')
      .select('riot_match_id')
      .in('riot_match_id', newMatchIds);

    const existingMatchIds = new Set((existingRecords || []).map(r => r.riot_match_id));

    const novelMatches = dmMatches.filter(m => !existingMatchIds.has(m.matchId));

    if (novelMatches.length === 0) {
      return { synced: 0, results: [], message: 'No new matches found' };
    }

    // Insertar cada match en la BDD
    const resolvedResults = [];
    for (const match of novelMatches) {
      
      // Calificación base temporal, un DM real depende de métricas KDA
      const thresholdPass = 15;
      const thresholdExc = 30;
      const grade = this.grading.calculateGrade(match.stats.kills, thresholdPass, thresholdExc);

      const { data: record, error } = await client
        .from('exercise_results')
        .insert({
          session_id: session.id,
          // Un exercise_id genérico para DM, en producción requerirá template específico
          exercise_id: '00000000-0000-0000-0000-000000000000', 
          score: match.stats.kills,
          metric_unit: 'kills',
          grade,
          riot_match_id: match.matchId,
        })
        .select()
        .single();

      if (!error) resolvedResults.push(record);
    }

    // 4. Update session
    await client
      .from('daily_sessions')
      .update({ is_dm_done: true })
      .eq('id', session.id);

    // 5. Autocompletar si se cumple
    if (session.is_gallery_done) {
      await this.sessionService.markSessionCompleted(userId, session.id, token);
    }

    return {
      synced: novelMatches.length,
      results: resolvedResults
    };
  }
}
