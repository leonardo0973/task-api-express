import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export const validateCompletion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const completed: unknown = req.body?.completed;

  if (typeof completed !== 'boolean') {
    next(new AppError(
      'La solicitud contiene datos inválidos.',
      422,
      'VALIDATION_ERROR',
      [{ field: 'completed', message: 'Debe ser true o false.' }]
    ));
    return;
  }

  res.locals.taskCompleted = completed;
  next();
};
