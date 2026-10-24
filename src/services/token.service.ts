import { SignJWT, errors, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { isUserRole, type User } from '../models/user.js';
import type { AccessTokenSubject } from '../types/auth.js';

const JWT_ALGORITHM = 'HS256';
const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export const createAccessToken = async (user: User): Promise<string> =>
  new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: 'JWT' })
    .setSubject(user.id)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey);

// Lista para el middleware de A10; todavía no protege ninguna ruta.
export const verifyAccessToken = async (
  token: string
): Promise<AccessTokenSubject> => {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithms: [JWT_ALGORITHM]
    });
    if (typeof payload.sub !== 'string' || !isUserRole(payload.role)) {
      throw new AppError('El token no contiene una identidad válida.', 401, 'INVALID_TOKEN');
    }
    return { userId: payload.sub, role: payload.role };
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    if (error instanceof errors.JOSEError) {
      throw new AppError('El token no es válido o expiró.', 401, 'INVALID_TOKEN');
    }
    throw new AppError('No fue posible verificar el token.', 401, 'INVALID_TOKEN');
  }
};
