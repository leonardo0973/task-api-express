// Traduce acciones de la interfaz en llamadas HTTP. Los componentes no
// construyen rutas ni conocen la URL base.
import { apiRequest } from './api.js';
import type {
  ApiEnvelope,
  CreateTaskInput,
  LoginData,
  RegisterData,
  Task,
  TaskListQuery,
  TaskListResponse,
  UpdateTaskInput,
  User
} from './types.js';

export const register = (
  name: string,
  email: string,
  password: string
): Promise<ApiEnvelope<RegisterData>> =>
  apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });

export const login = (email: string, password: string): Promise<ApiEnvelope<LoginData>> =>
  apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export const getMe = (token: string): Promise<ApiEnvelope<{ user: User }>> =>
  apiRequest('/api/auth/me', {}, token);

export const listTasks = (query: TaskListQuery, token: string): Promise<TaskListResponse> => {
  const parameters = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    order: query.order
  });
  if (query.status) parameters.set('status', query.status);
  if (query.search.trim()) parameters.set('search', query.search.trim());
  return apiRequest(`/api/tasks?${parameters.toString()}`, {}, token);
};

export const getTask = (id: string, token: string): Promise<ApiEnvelope<Task>> =>
  apiRequest(`/api/tasks/${encodeURIComponent(id)}`, {}, token);

export const createTask = (input: CreateTaskInput, token: string): Promise<ApiEnvelope<Task>> =>
  apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify(input) }, token);

export const updateTask = (
  id: string,
  input: UpdateTaskInput,
  token: string
): Promise<ApiEnvelope<Task>> =>
  apiRequest(
    `/api/tasks/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    token
  );

// La API responde 204 sin cuerpo.
export const deleteTask = (id: string, token: string): Promise<void> =>
  apiRequest(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);
