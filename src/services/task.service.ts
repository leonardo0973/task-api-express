import { tasks } from '../data/tasks.js';
import { AppError } from '../errors/app-error.js';
import type { Task } from '../models/task.js';

const MAX_TITLE_LENGTH = 120;

const notFoundError = (id: number): AppError =>
  new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');

// Defensa mínima del servicio: protege la invariante aunque se llame desde
// otro lugar distinto de las rutas (pruebas o una futura interfaz).
const normalizeTitle = (title: unknown): string => {
  if (typeof title !== 'string' || !title.trim()) {
    throw new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      [{ field: 'title', message: 'Debe ser texto no vacío.' }]
    );
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    throw new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      [{ field: 'title', message: `No debe superar ${MAX_TITLE_LENGTH} caracteres.` }]
    );
  }

  return title.trim();
};

export const listTasks = (): readonly Task[] => tasks;

export const findTaskById = (id: number): Task => {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    throw notFoundError(id);
  }

  return task;
};

export const createTask = (title: unknown): Task => {
  const task: Task = {
    id: Math.max(0, ...tasks.map((item) => item.id)) + 1,
    title: normalizeTitle(title),
    status: 'pending',
    createdAt: new Date()
  };

  tasks.push(task);
  return task;
};

export const updateTaskTitle = (id: number, title: unknown): Task => {
  const task = findTaskById(id);
  task.title = normalizeTitle(title);
  return task;
};

export const completeTask = (id: number): Task => {
  const task = findTaskById(id);
  task.status = 'completed';
  return task;
};

export const setTaskCompletion = (id: number, completed: boolean): Task => {
  const task = findTaskById(id);
  task.status = completed ? 'completed' : 'pending';
  return task;
};

export const deleteTask = (id: number): void => {
  const index = tasks.findIndex((item) => item.id === id);

  if (index === -1) {
    throw notFoundError(id);
  }

  tasks.splice(index, 1);
};
