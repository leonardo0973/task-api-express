import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../errors/app-error.js';

export const validateTaskId = (
  _req: Request,
  res: Response,
  next: NextFunction,
  value: string
): void => {
  const isObjectId = Types.ObjectId.isValid(value)
    && new Types.ObjectId(value).toHexString() === value.toLowerCase();

  if (!isObjectId) {
    next(new AppError('El id debe ser un ObjectId válido.', 400, 'INVALID_ID'));
    return;
  }

  res.locals.taskId = value;
  next();
};
