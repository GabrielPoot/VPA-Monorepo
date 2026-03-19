import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '../common/guards/auth.guard';
import type { AuthenticatedRequest } from '../common/guards/auth.guard';
import { createZodDto } from 'nestjs-zod';
import { UpdateProfileSchema } from '@vpa/shared';

// createZodDto para mapear el esquema a clase NestJS
export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}

@UseGuards(AuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.profileService.getProfile(req.user.id, req.token);
  }

  @Put()
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(req.user.id, req.token, updateDto);
  }
}
