// Desafío A12: estado de la vista /tasks/:id. Consulta GET /api/tasks/:id con el
// token Bearer; la API es la única fuente de verdad (no se reutiliza la lista).
import { ApiHttpError } from './api.js';
import { getTask } from './task-api.js';
import type { Task } from './types.js';

export type TaskDetailState =
  | { kind: 'loading' }
  | { kind: 'found'; task: Task }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'not-found'; message: string }
  | { kind: 'invalid-id'; message: string }
  | { kind: 'error'; message: string };

const withReference = (error: ApiHttpError): string =>
  error.requestId ? `${error.message} Referencia: ${error.requestId}.` : error.message;

export const loadTaskDetail = async (id: string, token: string): Promise<TaskDetailState> => {
  try {
    const response = await getTask(id, token);
    return { kind: 'found', task: response.data };
  } catch (error: unknown) {
    if (error instanceof ApiHttpError) {
      if (error.status === 401) return { kind: 'unauthorized', message: withReference(error) };
      if (error.status === 404) return { kind: 'not-found', message: withReference(error) };
      if (error.status === 400) return { kind: 'invalid-id', message: withReference(error) };
      return { kind: 'error', message: withReference(error) };
    }
    return { kind: 'error', message: 'No fue posible comunicarse con la API.' };
  }
};
