import { Controller, Post, Body, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyRiotDto } from './dto/auth.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import type { AuthenticatedRequest } from '../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard)
  @Post('verify-riot')
  async verifyRiot(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyRiotDto,
  ) {
    return this.authService.verifyRiot(req.user.id, req.token, dto);
  }

  @UseGuards(AuthGuard)
  @Delete('unlink-riot')
  async unlinkRiot(@Req() req: AuthenticatedRequest) {
    return this.authService.unlinkRiot(req.user.id, req.token);
  }
}
