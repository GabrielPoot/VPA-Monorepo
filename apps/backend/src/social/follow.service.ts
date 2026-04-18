import { Injectable, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginatorDto, PaginationParams } from '@vpa/shared';
import { NotificationService } from './notification.service';

@Injectable()
export class FollowService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Genera el seguimiento respetando las leyes de privacidad.
   */
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Users cannot follow themselves');
    }

    const client = this.supabase.getClientWithAuth(followerId);

    // 1. Check if already following or pending
    const { data: existing } = await client
      .from('follows')
      .select('status')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      throw new UnprocessableEntityException(`Follow relationship already exists with status: ${existing.status}`);
    }

    // 2. Fetch destination profile to check privacy mode
    const { data: targetProfile, error: profileErr } = await client
      .from('profiles')
      .select('privacy_mode, username')
      .eq('id', followingId)
      .single();

    if (profileErr || !targetProfile) {
      throw new BadRequestException('Target user not found');
    }

    // 3. Insert Follow record
    const status = targetProfile.privacy_mode ? 'pending' : 'accepted';
    const { error: insertErr } = await client
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
        status
      });

    if (insertErr) {
      throw new BadRequestException('Failed to follow user');
    }

    // 4. Inyectar Notificación UX Notification (Omitir await para no bloquear)
    if (status === 'pending') {
      this.notificationService.createNotification(client, followingId, 'FOLLOW_REQ', {
        title: 'Nueva solicitud de seguimiento',
        message: 'Un usuario quiere seguir tus estadísticas.',
        variant: 'info'
      }).catch(() => null);
    } else {
      // Opcional: Notificar "Te ha empezado a seguir"
      this.notificationService.createNotification(client, followingId, 'FOLLOW_REQ', {
        title: 'Nuevo Seguidor',
        message: 'Tienes un nuevo discípulo prestando atención a tus tácticas.',
        variant: 'success'
      }).catch(() => null);
    }

    return { status };
  }

  async unfollow(followerId: string, followingId: string) {
    const client = this.supabase.getClientWithAuth(followerId);
    await client
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
      
    return { success: true };
  }

  async acceptRequest(followId: string, userId: string) {
    const client = this.supabase.getClientWithAuth(userId);
    const { error } = await client
      .from('follows')
      .update({ status: 'accepted' })
      .eq('id', followId)
      .eq('following_id', userId); // Asegura ownership

    if (error) {
      throw new BadRequestException('Failed to accept follow request');
    }
    return { success: true };
  }

  async rejectRequest(followId: string, userId: string) {
    const client = this.supabase.getClientWithAuth(userId);
    const { error } = await client
      .from('follows')
      .delete()
      .eq('id', followId)
      .eq('following_id', userId);

    if (error) {
      throw new BadRequestException('Failed to reject follow request');
    }
    return { success: true };
  }

  /**
   * Helper para queries paginadas sobre joins
   */
  private async getPagedJoin(
    userId: string,
    queryColumn: 'follower_id' | 'following_id',
    relationshipId: string,
    pagination: PaginationParams,
    statusFilter: 'accepted' | 'pending' = 'accepted'
  ): Promise<PaginatorDto<any>> {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 10, 50);
    const offset = (page - 1) * limit;

    const client = this.supabase.getClientWithAuth(userId);

    // Debido a que supabase-js es un poco tricky con inner joins inversos,
    // usamos una vista o simulamos con supabase query options:
    const joinTable = queryColumn === 'follower_id' ? 'following_id' : 'follower_id';
    
    // Select followers/following merging profiles data
    const { data, count, error } = await client
      .from('follows')
      .select(`
        id,
        status,
        created_at,
        profiles!follows_${joinTable}_fkey(
          id, username, riot_id, riot_tag, avatar_url, region, current_streak
        )
      `, { count: 'exact' })
      .eq(queryColumn, relationshipId)
      .eq('status', statusFilter)
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(`Failed to retrieve: ${error.message}`);

    const total = count || 0;
    const hasNext = offset + limit < total;

    return {
      data: data || [],
      meta: { total, page, limit, hasNext }
    };
  }

  getFollowers(userId: string, pagination: PaginationParams) {
    // followers: target is following_id, join on follower_id
    return this.getPagedJoin(userId, 'following_id', userId, pagination, 'accepted');
  }

  getFollowing(userId: string, pagination: PaginationParams) {
    // following: target is follower_id, join on following_id
    return this.getPagedJoin(userId, 'follower_id', userId, pagination, 'accepted');
  }

  getPendingRequests(userId: string, pagination: PaginationParams) {
    return this.getPagedJoin(userId, 'following_id', userId, pagination, 'pending');
  }
}
