import type { Request, Response } from 'express';
import {
  completeTask,
  createTask,
  deleteTask,
  findTaskById,
  listTasks,
  updateTask
} from '../services/task.service.js';

export const getTasks = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ data: await listTasks() });
};

export const getTask = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ data: await findTaskById(res.locals.taskId) });
};

export const postTask = async (_req: Request, res: Response): Promise<void> => {
  const task = await createTask(res.locals.taskTitle, res.locals.taskPriority);
  res.status(201).json({ data: task });
};

export const patchTaskComplete = async (_req: Request, res: Response): Promise<void> => {
  const task = await completeTask(res.locals.taskId);
  res.status(200).json({ data: task });
};

export const patchTask = async (_req: Request, res: Response): Promise<void> => {
  const task = await updateTask(res.locals.taskId, res.locals.taskUpdate);
  res.status(200).json({ data: task });
};

export const removeTask = async (_req: Request, res: Response): Promise<void> => {
  await deleteTask(res.locals.taskId);
  res.status(204).send();
};
