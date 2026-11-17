import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { getCurrentUser, loginUser, registerUser } from '../services/auth.service.js';

export const postRegister = async (_req: Request, res: Response): Promise<void> => {
  res.status(201).json({ data: await registerUser(res.locals.registerInput) });
};

export const postLogin = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ data: await loginUser(res.locals.loginInput) });
};

// A11: devuelve el usuario público actual (sin contraseña ni hash) a partir del
// userId verificado en el JWT; el cliente nunca envía su identificador.
export const getMe = async (_req: Request, res: Response): Promise<void> => {
  const auth = res.locals.auth;
  if (!auth) {
    throw new AppError('Debes enviar un token de acceso.', 401, 'AUTHENTICATION_REQUIRED');
  }
  res.status(200).json({ data: await getCurrentUser(auth.userId) });
};
