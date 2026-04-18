import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginatorDto, PaginationParams } from '@vpa/shared';

@Injectable()
export class NotificationService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Obtiene la lista de notificaciones con paginación optimizada para UI loaders
   */
  async getNotifications(
    userId: string,
    filters: { isRead?: boolean; type?: string },
    pagination: PaginationParams
  ): Promise<PaginatorDto<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const limitSafe = Math.min(limit, 50);

    const client = this.supabase.getClientWithAuth(userId);
    let query = client
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitSafe - 1);

    if (filters.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, count, error } = await query;
    if (error) {
      throw new BadRequestException('Error retrieving notifications');
    }

    const total = count || 0;
    const hasNext = offset + limitSafe < total;

    return {
      data: data || [],
      meta: {
        total,
        page,
        limit: limitSafe,
        hasNext
      }
    };
  }

  /**
   * UX action (remove badge)
   */
  async markAsRead(notificationId: string, userId: string) {
    const client = this.supabase.getClientWithAuth(userId);
    const { data, error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to mark notification as read');
    }
    return data;
  }

  /**
   * Internal generator with UX parameters enforced by the standard payload 
   */
  async createNotification(
    client: any, // Supabase client from requesting service
    userId: string,
    type: string,
    payload: { title: string; message: string; variant: 'success' | 'warning' | 'info' | 'error'; metadata?: any }
  ) {
    const { data, error } = await client
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        data: payload
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create notification: ${error.message}`);
    }
    return data;
  }
}
