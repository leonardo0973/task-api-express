import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

// Un UUID nuevo por solicitud: aparece en error.requestId y en X-Request-Id.
export const requestContext = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
