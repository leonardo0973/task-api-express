import mongoose, { type HydratedDocument } from 'mongoose';
import { AppError } from '../errors/app-error.js';
import {
  TaskModel,
  type Task,
  type TaskPersistence
} from '../models/task.js';

const toTask = (document: HydratedDocument<TaskPersistence>): Task => {
  const task: Task = {
    id: document._id.toString(),
    title: document.title,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
  if (document.description) {
    task.description = document.description;
  }
  return task;
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

export const listTasks = async (): Promise<Task[]> => {
  try {
    const documents = await TaskModel.find().sort({ createdAt: 1 });
    return documents.map(toTask);
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};

export const findTaskById = async (id: string): Promise<Task> => {
  try {
    const document = await TaskModel.findById(id);
    if (!document) {
      throw new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');
    }
    return toTask(document);
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};

export const createTask = async (title: string, description?: string): Promise<Task> => {
  try {
    const document = await TaskModel.create({
      title,
      ...(description ? { description } : {}),
      status: 'pending'
    });
    return toTask(document);
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};

export const completeTask = async (id: string): Promise<Task> => {
  try {
    const document = await TaskModel.findByIdAndUpdate(
      id,
      { status: 'completed' },
      { new: true, runValidators: true }
    );
    if (!document) {
      throw new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');
    }
    return toTask(document);
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    const document = await TaskModel.findByIdAndDelete(id);
    if (!document) {
      throw new AppError(`No existe una tarea con el id ${id}.`, 404, 'TASK_NOT_FOUND');
    }
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};
