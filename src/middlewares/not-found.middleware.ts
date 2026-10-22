import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export const notFound = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(
    `No existe ${req.method} ${req.originalUrl}.`,
    404,
    'ROUTE_NOT_FOUND'
  ));
};
