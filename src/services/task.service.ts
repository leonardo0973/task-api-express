import type { HydratedDocument } from 'mongoose';
import { AppError } from '../errors/app-error.js';
import type {
  Task,
  TaskPersistence,
  TaskPriority,
  TaskUpdate
} from '../models/task.js';
import {
  createTaskDocument,
  deleteTaskDocument,
  findTaskDocumentById,
  findTaskDocuments,
  updateTaskDocument
} from '../repositories/task.repository.js';
import type { TaskListQuery, TaskListResult } from '../types/task-query.js';

const toTask = (document: HydratedDocument<TaskPersistence>): Task => ({
  id: document._id.toString(),
  title: document.title,
  status: document.status,
  priority: document.priority,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
});

const notFound = (id: string): AppError =>
  new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');

export const listTasks = async (
  query: TaskListQuery
): Promise<TaskListResult> => {
  const { documents, total } = await findTaskDocuments(query);
  const totalPages = Math.ceil(total / query.limit);
  return {
    data: documents.map(toTask),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1 && totalPages > 0
    }
  };
};

export const findTaskById = async (id: string): Promise<Task> => {
  const document = await findTaskDocumentById(id);
  if (!document) throw notFound(id);
  return toTask(document);
};

export const createTask = async (
  title: string,
  priority?: TaskPriority
): Promise<Task> => {
  const document = await createTaskDocument(title, priority);
  return toTask(document);
};

export const updateTask = async (
  id: string,
  changes: TaskUpdate
): Promise<Task> => {
  const document = await updateTaskDocument(id, changes);
  if (!document) throw notFound(id);
  return toTask(document);
};

export const completeTask = async (id: string): Promise<Task> =>
  updateTask(id, { status: 'completed' });

export const deleteTask = async (id: string): Promise<void> => {
  const document = await deleteTaskDocument(id);
  if (!document) throw notFound(id);
};
