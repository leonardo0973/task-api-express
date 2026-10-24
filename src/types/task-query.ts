import type { Task, TaskStatus } from '../models/task.js';

export const TASK_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'status'
] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const TASK_SORT_ORDERS = ['asc', 'desc'] as const;
export type TaskSortOrder = (typeof TASK_SORT_ORDERS)[number];

export const DEFAULT_TASK_PAGE = 1;
export const DEFAULT_TASK_LIMIT = 10;
export const MAX_TASK_PAGE = 100_000;
export const MAX_TASK_LIMIT = 50;
export const MAX_TASK_SEARCH_LENGTH = 60;

export interface TaskListQuery {
  page: number;
  limit: number;
  status?: TaskStatus;
  search?: string;
  sortBy: TaskSortField;
  order: TaskSortOrder;
  // Desafío individual A8: rango opcional sobre createdAt.
  createdFrom?: Date;
  createdTo?: Date;
}

export interface TaskPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TaskListResult {
  data: Task[];
  meta: TaskPaginationMeta;
}
