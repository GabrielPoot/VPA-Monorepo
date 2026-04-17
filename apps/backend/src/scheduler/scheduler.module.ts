import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionSchedulerService } from './session-scheduler.service';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Módulo global de Nest para manejo de Cron
    TrainingModule, // Importamos para acceder a la BD/Supabase a través de servicios si fuera necesario, aunque es mejor instanciar Supabase directo.
  ],
  providers: [SessionSchedulerService],
})
export class SchedulerModule {}
