import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SearchService } from './search.service';
import { FollowService } from './follow.service';

@Module({
  providers: [NotificationService, SearchService, FollowService],
  exports: [NotificationService, FollowService],
})
export class SocialModule {}
