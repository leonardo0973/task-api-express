import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { checkDatabaseHealth } from '../services/database.service.js';

// No expone configuración sensible: solo estado, versión y ambiente.
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    data: {
      status: 'up',
      version: env.APP_VERSION,
      environment: env.NODE_ENV
    }
  });
};

// 200 con status up cuando Atlas responde al ping; 503 con status down si no.
export const getDatabaseHealth = async (_req: Request, res: Response): Promise<void> => {
  const health = await checkDatabaseHealth();
  res.status(health.status === 'up' ? 200 : 503).json({ data: health });
};
