import type { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/auth.service.js';

export const postRegister = async (_req: Request, res: Response): Promise<void> => {
  res.status(201).json({ data: await registerUser(res.locals.registerInput) });
};

export const postLogin = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ data: await loginUser(res.locals.loginInput) });
};

// Devuelve solo userId y role verificados por authenticate; nunca el token.
export const getMe = (_req: Request, res: Response): void => {
  const auth = res.locals.auth;
  res.status(200).json({
    data: { identity: { userId: auth?.userId, role: auth?.role } }
  });
};
