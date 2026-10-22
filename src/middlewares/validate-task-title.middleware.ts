import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export const validateTaskTitle = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const title: unknown = req.body?.title;

  if (typeof title !== 'string' || !title.trim()) {
    next(new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      [{ field: 'title', message: 'Debe ser texto no vacío.' }]
    ));
    return;
  }

  if (title.trim().length > 120) {
    next(new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      [{ field: 'title', message: 'No debe superar 120 caracteres.' }]
    ));
    return;
  }

  res.locals.taskTitle = title.trim();
  next();
};
