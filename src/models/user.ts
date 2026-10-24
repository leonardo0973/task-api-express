import { Schema, model } from 'mongoose';

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLES.some((role) => role === value);

export interface UserPersistence {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserPersistence>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      minlength: [2, 'El nombre debe contener al menos 2 caracteres.'],
      maxlength: [80, 'El nombre no debe superar 80 caracteres.']
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio.'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'El correo no debe superar 254 caracteres.'],
      unique: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const UserModel = model<UserPersistence>('User', userSchema);
