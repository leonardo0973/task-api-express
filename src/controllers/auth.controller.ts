import type { Request, Response } from 'express';
import {
  getAuthenticatedUser,
  loginUser,
  registerUser
} from '../services/auth.service.js';

export const postRegister = async (_req: Request, res: Response): Promise<void> => {
  res.status(201).json({ data: await registerUser(res.locals.registerInput) });
};

export const postLogin = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ data: await loginUser(res.locals.loginInput) });
};

// El id proviene solo del JWT verificado por authenticate; nunca de params ni body.
export const getMe = async (_req: Request, res: Response): Promise<void> => {
  const auth = res.locals.auth;
  if (!auth) {
    throw new Error('La ruta /me requiere el middleware authenticate.');
  }
  res.status(200).json({
    data: { user: await getAuthenticatedUser(auth.userId) }
  });
};
