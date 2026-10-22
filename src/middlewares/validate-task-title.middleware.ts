import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export const validateTaskTitle = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const title: unknown = req.body?.title;
  const description: unknown = req.body?.description;
  const details: Array<{ field: string; message: string }> = [];

  if (typeof title !== 'string' || !title.trim()) {
    details.push({ field: 'title', message: 'Debe ser texto no vacío.' });
  } else if (title.trim().length > 120) {
    details.push({ field: 'title', message: 'No debe superar 120 caracteres.' });
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      details.push({ field: 'description', message: 'Debe ser texto.' });
    } else if (description.trim().length > 300) {
      details.push({ field: 'description', message: 'No debe superar 300 caracteres.' });
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
  res.locals.taskDescription = typeof description === 'string' ? description.trim() : undefined;
  next();
};
