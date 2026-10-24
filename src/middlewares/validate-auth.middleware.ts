import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import type { FieldIssue } from '../types/api-error.js';
import {
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_CHARACTERS,
  type LoginInput,
  type RegisterInput
} from '../types/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateAllowedFields = (
  body: Record<string, unknown>,
  allowedFields: ReadonlySet<string>,
  issues: FieldIssue[]
): void => {
  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) {
      issues.push({ field, message: 'El campo no está permitido.' });
    }
  }
};

const readEmail = (
  body: Record<string, unknown>,
  issues: FieldIssue[]
): string | undefined => {
  if (typeof body.email !== 'string') {
    issues.push({ field: 'email', message: 'Debe ser texto.' });
    return undefined;
  }
  const email = body.email.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    issues.push({ field: 'email', message: 'Debe ser un correo electrónico válido.' });
    return undefined;
  }
  return email;
};

const readPassword = (
  body: Record<string, unknown>,
  issues: FieldIssue[],
  validateMinimum: boolean
): string | undefined => {
  if (typeof body.password !== 'string' || !body.password) {
    issues.push({ field: 'password', message: 'Debe ser texto no vacío.' });
    return undefined;
  }
  const length = Array.from(body.password).length;
  if (validateMinimum && length < MIN_PASSWORD_CHARACTERS) {
    issues.push({
      field: 'password',
      message: `Debe contener al menos ${MIN_PASSWORD_CHARACTERS} caracteres.`
    });
  }
  if (Buffer.byteLength(body.password, 'utf8') > MAX_PASSWORD_BYTES) {
    issues.push({
      field: 'password',
      message: `No debe superar ${MAX_PASSWORD_BYTES} bytes en UTF-8.`
    });
  }
  return body.password;
};

// Desafío individual A9: confirmPassword pertenece solo al contrato HTTP.
// Se exige y se compara aquí, y nunca se copia a RegisterInput.
const checkConfirmPassword = (
  body: Record<string, unknown>,
  password: string | undefined,
  issues: FieldIssue[]
): void => {
  if (typeof body.confirmPassword !== 'string' || !body.confirmPassword) {
    issues.push({ field: 'confirmPassword', message: 'Debe ser texto no vacío.' });
    return;
  }
  if (password !== undefined && body.confirmPassword !== password) {
    issues.push({ field: 'confirmPassword', message: 'Debe coincidir con password.' });
  }
};

const rejectInvalidInput = (issues: FieldIssue[], next: NextFunction): boolean => {
  if (issues.length === 0) return false;
  next(new AppError(
    'Los datos de autenticación no son válidos.',
    422,
    'AUTH_VALIDATION_ERROR',
    issues
  ));
  return true;
};

const rejectNonObject = (next: NextFunction): void => {
  next(new AppError(
    'Los datos de autenticación no son válidos.',
    422,
    'AUTH_VALIDATION_ERROR',
    [{ field: 'body', message: 'Debe ser un objeto JSON.' }]
  ));
};

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body: unknown = req.body;
  const issues: FieldIssue[] = [];
  if (!isRecord(body)) {
    rejectNonObject(next);
    return;
  }
  validateAllowedFields(
    body,
    new Set(['name', 'email', 'password', 'confirmPassword']),
    issues
  );
  let name: string | undefined;
  if (typeof body.name !== 'string') {
    issues.push({ field: 'name', message: 'Debe ser texto.' });
  } else {
    const normalized = body.name.trim();
    if (normalized.length < 2 || normalized.length > 80) {
      issues.push({ field: 'name', message: 'Debe contener entre 2 y 80 caracteres.' });
    } else name = normalized;
  }
  const email = readEmail(body, issues);
  const password = readPassword(body, issues, true);
  checkConfirmPassword(body, password, issues);
  if (rejectInvalidInput(issues, next)) return;
  res.locals.registerInput = { name, email, password } as RegisterInput;
  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body: unknown = req.body;
  const issues: FieldIssue[] = [];
  if (!isRecord(body)) {
    rejectNonObject(next);
    return;
  }
  validateAllowedFields(body, new Set(['email', 'password']), issues);
  const email = readEmail(body, issues);
  const password = readPassword(body, issues, false);
  if (rejectInvalidInput(issues, next)) return;
  res.locals.loginInput = { email, password } as LoginInput;
  next();
};
