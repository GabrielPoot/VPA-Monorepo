import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { FastifyRequest } from 'fastify';

/**
 * Interface custom para agregar el user de supabase a la request de Fastify
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: any;
  token: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    // Verify token with Supabase and get user
    const { data, error } = await this.supabaseService.anonClient.auth.getUser(
      token,
    );

    if (error || !data.user) {
      throw new UnauthorizedException(error?.message || 'Invalid token');
    }

    // Attach user and raw token to request for downstream usage
    request.user = data.user;
    request.token = token;

    return true;
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
