import cors, { type CorsOptions } from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Sin Origin: Postman, apps móviles o servidor a servidor.
    if (!origin || origin === env.CORS_ORIGIN) {
      callback(null, true);
      return;
    }
    // Origen no permitido: se omite el permiso CORS (no es un error 500).
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
  maxAge: 600
};

export const securityHeaders = helmet();
// Solo para /api-docs y /api-docs.json: Swagger UI necesita sus propios
// scripts y estilos. El resto de la API conserva la CSP completa.
export const documentationSecurityHeaders = helmet({
  contentSecurityPolicy: false
});
export const corsPolicy = cors(corsOptions);

export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(_req, _res, next) {
    next(new AppError(
      'Demasiados intentos de autenticación. Intenta más tarde.',
      429,
      'AUTH_RATE_LIMIT_EXCEEDED'
    ));
  }
});
