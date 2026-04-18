import { PaginationMeta } from '../types/api.types';

export interface PaginatorDto<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
