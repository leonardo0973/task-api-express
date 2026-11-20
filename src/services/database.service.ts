import mongoose from 'mongoose';
import { isDatabaseConnected } from '../config/database.js';
import { describeDatabaseError } from '../errors/database-error.js';

export type DatabaseHealth =
  | { status: 'up'; database: string; ping: 'ok'; latencyMs: number }
  | { status: 'down' };

const PING_TIMEOUT_MS = 3000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PingTimeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); }
    );
  });

export const checkDatabaseHealth = async (): Promise<DatabaseHealth> => {
  const db = mongoose.connection.db;

  if (!isDatabaseConnected() || !db) {
    return { status: 'down' };
  }

  const startedAt = performance.now();

  try {
    await withTimeout(db.command({ ping: 1 }), PING_TIMEOUT_MS);
  } catch (error: unknown) {
    console.error(`[mongodb] Ping fallido: ${describeDatabaseError(error)}`);
    return { status: 'down' };
  }

  return {
    status: 'up',
    database: db.databaseName,
    ping: 'ok',
    latencyMs: Math.round(performance.now() - startedAt)
  };
};
