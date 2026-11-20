export type UserRole = 'user' | 'admin';
export type TaskStatus = 'pending' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSortField = 'title' | 'status' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Las fechas llegan como texto JSON (ISO 8601).
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LoginData {
  user: User;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface RegisterData {
  user: User;
}

// status y search vacíos solo existen en la interfaz; no se envían a la API.
export interface TaskListQuery {
  page: number;
  limit: number;
  status: '' | TaskStatus;
  search: string;
  sortBy: TaskSortField;
  order: SortOrder;
}

export interface CreateTaskInput {
  title: string;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface ApiEnvelope<T> {
  data: T;
}

export interface TaskListResponse {
  data: Task[];
  meta: PaginationMeta;
}

export interface ApiErrorData {
  code: string;
  message: string;
  details?: unknown[];
  requestId?: string;
}
