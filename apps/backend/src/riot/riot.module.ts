import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RiotApiService } from './riot-api.service';
import { RiotAccountService } from './riot-account.service';
import { RiotMatchService } from './riot-match.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [RiotApiService, RiotAccountService, RiotMatchService],
  exports: [RiotAccountService, RiotMatchService],
})
export class RiotModule {}
