import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { TrainingModule } from './training/training.module';
import { RiotModule } from './riot/riot.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SocialModule } from './social/social.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    SupabaseModule,
    AuthModule,
    ProfileModule,
    TrainingModule,
    RiotModule,
    SchedulerModule,
    SocialModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
