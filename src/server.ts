import 'dotenv/config';
import { createServer } from 'node:http';
import { app } from './app.js';
import { EnvValidationError, loadEnv, type AppEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { describeDatabaseError } from './errors/database-error.js';
import { registerGracefulShutdown } from './lifecycle/graceful-shutdown.js';

const readEnv = (): AppEnv => {
  try {
    return loadEnv();
  } catch (error: unknown) {
    if (error instanceof EnvValidationError) {
      console.error('[config] No se puede iniciar la API:');
      error.issues.forEach((issue) => console.error(`  - ${issue}`));
    } else {
      console.error('[config] Error inesperado al leer el entorno.');
    }
    process.exit(1);
  }
};

const start = async (): Promise<void> => {
  const env = readEnv();

  // La API se conecta con Atlas ANTES de abrir el puerto.
  console.log('[mongodb] Conectando con MongoDB Atlas...');
  try {
    await connectDatabase(env);
  } catch (error: unknown) {
    console.error(`[mongodb] ${describeDatabaseError(error)}`);
    console.error('[server] La API no se inició porque la base de datos no está disponible.');
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  }
  console.log(`[mongodb] Conexión establecida con la base de datos "${env.mongodbDbName}".`);

  const server = createServer(app);

  server.on('error', async (error: NodeJS.ErrnoException) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? `[server] El puerto ${env.port} ya está en uso.`
        : `[server] No se pudo abrir el puerto (${error.code ?? error.name}).`
    );
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });

  server.listen(env.port, () => {
    console.log(`[server] API disponible en http://localhost:${env.port}`);
  });

  registerGracefulShutdown(server);
};

void start();
