import mongoose, { type HydratedDocument } from 'mongoose';
import { AppError } from '../errors/app-error.js';
import { UserModel, type UserPersistence, type UserRole } from '../models/user.js';

export type UserDocument = HydratedDocument<UserPersistence>;

export interface CreateUserRecord {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && error.code === 11_000;

const mapPersistenceError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (isDuplicateKeyError(error)) {
    return new AppError(
      'Ya existe una cuenta con ese correo electrónico.',
      409,
      'USER_EMAIL_EXISTS'
    );
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
    return new AppError(
      'El usuario no cumple las reglas del modelo.',
      422,
      'PERSISTENCE_VALIDATION_ERROR',
      details
    );
  }
  return new AppError(
    'No fue posible acceder al almacenamiento de usuarios.',
    503,
    'DATABASE_UNAVAILABLE'
  );
};

const execute = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error: unknown) {
    throw mapPersistenceError(error);
  }
};

export const findUserDocumentByEmail = async (
  email: string,
  includePasswordHash = false
): Promise<UserDocument | null> => execute(async () => {
  const query = UserModel.findOne({ email });
  if (includePasswordHash) query.select('+passwordHash');
  return query;
});

// A11: identidad actual para GET /api/auth/me (sin passwordHash).
export const findUserDocumentById = async (
  id: string
): Promise<UserDocument | null> => execute(async () => {
  if (!mongoose.isValidObjectId(id)) return null;
  return UserModel.findById(id);
});

export const createUserDocument = async (
  data: CreateUserRecord
): Promise<UserDocument> => execute(async () => UserModel.create(data));

// A10: usado solo por el script administrativo pnpm role:set.
export const setUserRoleByEmail = async (
  email: string,
  role: UserRole
): Promise<UserDocument | null> => execute(async () =>
  UserModel.findOneAndUpdate(
    { email },
    { $set: { role } },
    { new: true, runValidators: true }
  )
);
