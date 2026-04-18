import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginatorDto, PaginationParams } from '@vpa/shared';

@Injectable()
export class SearchService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Búsqueda polimórfica paginada adaptada para UX:
   * Evalúa intención mínima (3 chars) e intercepta para no devolver la identidad de quién busca.
   */
  async searchUsers(
    query: string,
    requesterId: string,
    pagination: PaginationParams
  ): Promise<PaginatorDto<any>> {
    const trimmedQuery = query.trim();

    // UX Constraint: No permitimos búsquedas pesadas con poca intención
    if (trimmedQuery.length < 3) {
      return {
        data: [],
        meta: {
          total: 0,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          hasNext: false
        }
      };
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;
    const limitSafe = Math.min(limit, 50);

    const client = this.supabase.getClientWithAuth(requesterId);

    // Búsqueda en profiles donde coincida username, riot_id o riot_tag
    // Excluyendo a sí mismo.
    const likePattern = `%${trimmedQuery}%`;

    const { data: results, count, error } = await client
      .from('profiles')
      .select('id, username, riot_id, riot_tag, avatar_url, region', { count: 'exact' })
      .neq('id', requesterId)
      .or(`username.ilike.${likePattern},riot_id.ilike.${likePattern},riot_tag.ilike.${likePattern}`)
      .range(offset, offset + limitSafe - 1)
      .limit(limitSafe);

    if (error) {
      throw new BadRequestException(`Search failed: ${error.message}`);
    }

    const total = count || 0;
    const hasNext = offset + limitSafe < total;

    // Aquí podríamos complementar inyectando bandera "is_following: boolean"
    // realizando un IN query sobre los IDs resultantes contra la tabla "follows"

    return {
      data: results || [],
      meta: {
        total,
        page,
        limit: limitSafe,
        hasNext
      }
    };
  }
}
