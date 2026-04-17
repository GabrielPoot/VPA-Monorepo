import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../common/guards/auth.guard';
import type { AuthenticatedRequest } from '../common/guards/auth.guard';
import { CommitmentService } from './commitment.service';
import { SessionService } from './session.service';
import { ResultService } from './result.service';
import { AnalyticsService } from './analytics.service';
import { CreateCommitmentDto, SubmitGalleryDto } from './dto/training.dto';

@UseGuards(AuthGuard)
@Controller('training')
export class TrainingController {
  constructor(
    private readonly commitmentService: CommitmentService,
    private readonly sessionService: SessionService,
    private readonly resultService: ResultService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // POST /training/commitments (30 req/min)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('commitments')
  async createCommitment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCommitmentDto,
  ) {
    return this.commitmentService.createCommitment(
      req.user.id,
      req.token,
      dto.routineId,
      // No difficulty passed, or change signature if needed. The schema has no difficulty
      // but wait, durationDays is the parameter in CreateCommitmentSchema
      dto.durationDays,
    );
  }

  // GET /training/commitments (60 req/min)
  // Our default is 100/min on AppModule, so we restrict slightly 
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('commitments')
  async getCommitments(@Req() req: AuthenticatedRequest) {
    return this.commitmentService.getCommitments(req.user.id, req.token);
  }

  // PATCH /training/commitments/:id/drop (30 req/min)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('commitments/:id/drop')
  async dropCommitment(
    @Req() req: AuthenticatedRequest,
    @Param('id') commitmentId: string,
  ) {
    return this.commitmentService.dropCommitment(req.user.id, req.token, commitmentId);
  }

  // GET /training/today (60 req/min)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('today')
  async getTodaySession(@Req() req: AuthenticatedRequest) {
    return this.sessionService.getTodaySession(req.user.id, req.token);
  }

  // GET /training/routines (60 req/min)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('routines')
  async getRoutines(@Req() req: AuthenticatedRequest) {
    // In a real app this could be its own service or controller, mapped here for reqs
    const client = this.resultService['supabase'].getClientWithAuth(req.token);
    const { data } = await client.from('routine_templates').select('*');
    return data;
  }

  // GET /training/sessions (60 req/min)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('sessions')
  async getSessions(@Req() req: AuthenticatedRequest) {
    const client = this.sessionService['supabase'].getClientWithAuth(req.token);
    const { data } = await client.from('daily_sessions').select('*').eq('user_id', req.user.id);
    return data;
  }

  // PATCH /training/sync-dm (10 req/min)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch('sync-dm')
  async syncDm(@Req() req: AuthenticatedRequest) {
    const session = await this.sessionService.getTodaySession(req.user.id, req.token);
    const client = this.sessionService['supabase'].getClientWithAuth(req.token);

    await client
      .from('daily_sessions')
      .update({ is_dm_done: true })
      .eq('id', session.id);

    // 7. Try to auto-complete session if Gallery is also done
    if (session.is_gallery_done) {
      await this.sessionService.markSessionCompleted(req.user.id, session.id, req.token);
    }

    return { message: 'DM status synced successfully' };
  }

  // POST /training/submit-gallery (30 req/min)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('submit-gallery')
  async submitGallery(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitGalleryDto,
  ) {
    return this.resultService.submitGalleryResult(req.user.id, req.token, dto);
  }

  // GET /training/analytics (60 req/min)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('analytics')
  async getAnalytics(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getAnalyticsSummary(req.user.id, req.token);
  }
}
