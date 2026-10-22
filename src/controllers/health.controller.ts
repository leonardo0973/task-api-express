import type { Request, Response } from 'express';
import { checkDatabaseHealth } from '../services/database.service.js';

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok' });
};

// Express 5 envía al errorHandler las promesas rechazadas automáticamente.
export const getDatabaseHealth = async (_req: Request, res: Response): Promise<void> => {
  const health = await checkDatabaseHealth();
  res.status(200).json({ data: health });
};
