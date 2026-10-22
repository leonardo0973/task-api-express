import mongoose from 'mongoose';
import type { AppEnv } from './env.js';
import { describeDatabaseError } from '../errors/database-error.js';

let closingIntentionally = false;
let listenersRegistered = false;

const registerConnectionListeners = (): void => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  // Solo se imprimen mensajes propios; nunca la URI, el host ni el error crudo.
  mongoose.connection.on('disconnected', () => {
    if (!closingIntentionally) {
      console.warn('[mongodb] Conexión perdida. Mongoose intentará reconectar.');
    }
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[mongodb] Conexión restablecida.');
  });

  mongoose.connection.on('error', (error: unknown) => {
    console.error(`[mongodb] ${describeDatabaseError(error)}`);
  });
};

export const connectDatabase = async (env: AppEnv): Promise<void> => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
    serverSelectionTimeoutMS: 8000,
    appName: 'task-api-express'
  });

  // Los eventos se escuchan después de la conexión inicial; un fallo al
  // arrancar se informa una sola vez desde server.ts.
  registerConnectionListeners();
};

export const disconnectDatabase = async (): Promise<void> => {
  closingIntentionally = true;
  await mongoose.disconnect();
};

export const isDatabaseConnected = (): boolean =>
  mongoose.connection.readyState === mongoose.ConnectionStates.connected;
