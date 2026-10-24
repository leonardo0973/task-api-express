import mongoose, {
  type FilterQuery,
  type HydratedDocument,
  type SortOrder
} from 'mongoose';
import { AppError } from '../errors/app-error.js';
import {
  TaskModel,
  type TaskPersistence,
  type TaskPriority,
  type TaskUpdate
} from '../models/task.js';
import type { TaskListQuery } from '../types/task-query.js';

type TaskDocument = HydratedDocument<TaskPersistence>;

export interface TaskPageDocuments {
  documents: TaskDocument[];
  total: number;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (query: TaskListQuery): FilterQuery<TaskPersistence> => {
  const filter: FilterQuery<TaskPersistence> = {};
  if (query.status !== undefined) filter.status = query.status;
  if (query.search !== undefined) {
    filter.title = { $regex: new RegExp(escapeRegex(query.search), 'i') };
  }
  // Desafío individual A8: rango sobre createdAt con $gte y $lte.
  if (query.createdFrom !== undefined || query.createdTo !== undefined) {
    filter.createdAt = {
      ...(query.createdFrom === undefined ? {} : { $gte: query.createdFrom }),
      ...(query.createdTo === undefined ? {} : { $lte: query.createdTo })
    };
  }
  return filter;
};

const buildSort = (query: TaskListQuery): Record<string, SortOrder> => {
  const direction: SortOrder = query.order === 'asc' ? 1 : -1;
  return { [query.sortBy]: direction, _id: direction };
};

const mapPersistenceError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
    return new AppError(
      'La tarea no cumple las reglas del modelo.',
      422,
      'PERSISTENCE_VALIDATION_ERROR',
      details
    );
  }
  return new AppError(
    'No fue posible acceder al almacenamiento de tareas.',
    503,
    'DATABASE_UNAVAILABLE'
  );
};

const execute = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};

export const findTaskDocuments = async (
  query: TaskListQuery
): Promise<TaskPageDocuments> => execute(async () => {
  const filter = buildFilter(query);
  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    TaskModel.find(filter)
      .sort(buildSort(query))
      .skip(skip)
      .limit(query.limit),
    TaskModel.countDocuments(filter)
  ]);
  return { documents, total };
});

export const findTaskDocumentById = async (
  id: string
): Promise<TaskDocument | null> => execute(async () => TaskModel.findById(id));

// Se conserva la prioridad opcional implementada en A7.
export const createTaskDocument = async (
  title: string,
  priority?: TaskPriority
): Promise<TaskDocument> => execute(async () =>
  TaskModel.create({
    title,
    status: 'pending',
    ...(priority ? { priority } : {})
  })
);

export const updateTaskDocument = async (
  id: string,
  changes: TaskUpdate
): Promise<TaskDocument | null> => execute(async () =>
  TaskModel.findByIdAndUpdate(
    id,
    { $set: changes },
    { new: true, runValidators: true }
  )
);

export const deleteTaskDocument = async (
  id: string
): Promise<TaskDocument | null> => execute(async () =>
  TaskModel.findByIdAndDelete(id)
);
