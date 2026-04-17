import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { CommitmentService } from './commitment.service';
import { SessionService } from './session.service';
import { ResultService } from './result.service';
import { AnalyticsService } from './analytics.service';
import { GradingModule } from '../grading/grading.module';
import { RiotModule } from '../riot/riot.module';

@Module({
  imports: [GradingModule, RiotModule],
  controllers: [TrainingController],
  providers: [
    CommitmentService,
    SessionService,
    ResultService,
    AnalyticsService,
  ],
})
export class TrainingModule {}
