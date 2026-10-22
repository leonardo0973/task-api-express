import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { isShuttingDown } from '../lifecycle/graceful-shutdown.js';

// Durante el cierre ordenado ya no se aceptan solicitudes nuevas.
export const shutdownGuard = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (isShuttingDown()) {
    res.setHeader('Connection', 'close');
    next(new AppError(
      'El servidor se está deteniendo. Intenta de nuevo más tarde.',
      503,
      'SERVICE_UNAVAILABLE'
    ));
    return;
  }

  next();
};
