import { Router } from 'express';
import { getMe, postLogin, postRegister } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { requireJson } from '../middlewares/require-json.middleware.js';
import { authRateLimiter } from '../middlewares/security.middleware.js';
import { validateLogin, validateRegister } from '../middlewares/validate-auth.middleware.js';

export const authRouter = Router();

// A11: el límite se aplica solo a los intentos de credenciales, no a /me.
authRouter.post(
  '/register',
  authRateLimiter,
  requireJson,
  validateRegister,
  postRegister
);
authRouter.post('/login', authRateLimiter, requireJson, validateLogin, postLogin);
authRouter.get('/me', authenticate, getMe);
