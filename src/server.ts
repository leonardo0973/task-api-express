import { createServer } from 'node:http';
import { env } from './config/env.js';
import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { describeDatabaseError } from './errors/database-error.js';
import { registerGracefulShutdown } from './lifecycle/graceful-shutdown.js';

const start = async (): Promise<void> => {
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
  console.log(`[mongodb] Conexión establecida con la base de datos "${env.MONGODB_DB_NAME}".`);

  const server = createServer(app);

  server.on('error', async (error: NodeJS.ErrnoException) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? `[server] El puerto ${env.PORT} ya está en uso.`
        : `[server] No se pudo abrir el puerto (${error.code ?? error.name}).`
    );
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });

  // 0.0.0.0 acepta conexiones de la red del contenedor (proxy de Render).
  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(
      `[server] API ${env.APP_VERSION} (${env.NODE_ENV}) escuchando en el puerto ${env.PORT}; URL pública ${env.PUBLIC_API_URL}`
    );
  });

  registerGracefulShutdown(server);
};

void start();
