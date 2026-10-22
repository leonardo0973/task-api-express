import type { Server } from 'node:http';
import { disconnectDatabase } from '../config/database.js';

const FORCE_EXIT_MS = 10_000;
let shuttingDown = false;

export const isShuttingDown = (): boolean => shuttingDown;

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    // close() deja de aceptar conexiones nuevas y espera a las activas.
    server.close((error) => (error ? reject(error) : resolve()));
    // Las conexiones keep-alive sin solicitudes en curso se cierran ya.
    server.closeIdleConnections();
  });

export const registerGracefulShutdown = (server: Server): void => {
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) {
      console.warn(`[shutdown] ${signal} recibido de nuevo; el cierre ya está en curso.`);
      return;
    }
    shuttingDown = true;
    console.log(`[shutdown] ${signal} recibido. Dejando de aceptar solicitudes...`);

    const forceTimer = setTimeout(() => {
      console.error('[shutdown] El cierre tardó demasiado; se fuerza la salida.');
      server.closeAllConnections();
      process.exit(1);
    }, FORCE_EXIT_MS);
    forceTimer.unref();

    try {
      await closeServer(server);
      console.log('[shutdown] Servidor HTTP cerrado.');
      await disconnectDatabase();
      console.log('[shutdown] Conexión con MongoDB cerrada.');
      clearTimeout(forceTimer);
      console.log('[shutdown] Proceso finalizado correctamente.');
      process.exit(0);
    } catch (error: unknown) {
      clearTimeout(forceTimer);
      console.error(`[shutdown] Error durante el cierre (${error instanceof Error ? error.name : 'desconocido'}).`);
      process.exit(1);
    }
  };

  process.on('SIGINT', (signal) => { void shutdown(signal); });
  process.on('SIGTERM', (signal) => { void shutdown(signal); });
};
