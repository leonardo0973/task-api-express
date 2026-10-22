import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { describeDatabaseError, isMongoError } from '../errors/database-error.js';
import type { ApiErrorPayload } from '../types/api-error.js';

const isInvalidJson = (error: unknown): boolean => {
  if (!(error instanceof SyntaxError)) return false;
  return 'status' in error
    && typeof error.status === 'number'
    && error.status === 400;
};

const sendError = (
  res: Response,
  status: number,
  payload: ApiErrorPayload
): void => {
  res.status(status).json({ error: payload });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const requestId: string | undefined = res.locals.requestId;

  if (error instanceof AppError) {
    sendError(res, error.statusCode, {
      code: error.code,
      message: error.message,
      details: error.details,
      requestId
    });
    return;
  }

  if (isInvalidJson(error)) {
    sendError(res, 400, {
      code: 'INVALID_JSON',
      message: 'El cuerpo contiene JSON inválido.',
      requestId
    });
    return;
  }

  // Un fallo del driver nunca se reenvía tal cual: puede incluir host o URI.
  if (isMongoError(error)) {
    console.error({ requestId, database: describeDatabaseError(error) });
    sendError(res, 503, {
      code: 'DATABASE_UNAVAILABLE',
      message: 'La base de datos no está disponible en este momento.',
      requestId
    });
    return;
  }

  console.error({
    requestId,
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error)
  });
  sendError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: 'Ocurrió un error interno.',
    requestId
  });
};
