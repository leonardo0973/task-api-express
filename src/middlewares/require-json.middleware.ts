import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export const requireJson = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.is('application/json')) {
    next(new AppError(
      'La solicitud debe usar Content-Type application/json.',
      415,
      'UNSUPPORTED_MEDIA_TYPE'
    ));
    return;
  }

  next();
};
