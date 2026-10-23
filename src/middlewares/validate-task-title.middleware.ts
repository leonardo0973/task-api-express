import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { TASK_PRIORITIES, type TaskPriority } from '../models/task.js';

const isTaskPriority = (value: unknown): value is TaskPriority =>
  typeof value === 'string' && TASK_PRIORITIES.some((priority) => priority === value);

export const validateTaskTitle = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const title: unknown = req.body?.title;
  const priority: unknown = req.body?.priority;
  const details: Array<{ field: string; message: string }> = [];

  if (typeof title !== 'string' || !title.trim()) {
    details.push({ field: 'title', message: 'Debe ser texto no vacío.' });
  } else if (title.trim().length > 120) {
    details.push({ field: 'title', message: 'No debe superar 120 caracteres.' });
  }

  if (priority !== undefined) {
    if (!isTaskPriority(priority)) {
      details.push({ field: 'priority', message: 'Debe ser low, medium o high.' });
    }
  }

  if (details.length > 0) {
    next(new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      details
    ));
    return;
  }

  res.locals.taskTitle = (title as string).trim();
  res.locals.taskPriority = typeof priority === 'string' ? priority : undefined;
  next();
};
