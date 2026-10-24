// Lee y valida las variables de entorno al cargar el proceso.
// Los mensajes indican el nombre de la variable, pero nunca imprimen su valor.
import 'dotenv/config';

export interface AppEnv {
  PORT: number;
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
}

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super('Configuración de entorno inválida.');
    this.name = 'EnvValidationError';
  }
}

const DB_NAME_PATTERN = /^[A-Za-z0-9_-]{1,63}$/;
const EXPIRATION_PATTERN = /^\d+[smhd]$/;
const MIN_JWT_SECRET_BYTES = 32;

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): AppEnv => {
  const issues: string[] = [];

  const port = Number(source.PORT?.trim() || '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    issues.push('PORT debe ser un número entero entre 1 y 65535.');
  }

  const mongodbUri = source.MONGODB_URI?.trim() ?? '';
  if (!mongodbUri) {
    issues.push('Falta la variable de entorno MONGODB_URI.');
  } else if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
    issues.push('MONGODB_URI debe comenzar con mongodb+srv:// o mongodb://.');
  } else if (/<[^>]+>/.test(mongodbUri)) {
    issues.push('MONGODB_URI todavía contiene marcadores como <USUARIO> o <CONTRASENA>.');
  }

  const mongodbDbName = source.MONGODB_DB_NAME?.trim() ?? '';
  if (!mongodbDbName) {
    issues.push('Falta la variable de entorno MONGODB_DB_NAME.');
  } else if (!DB_NAME_PATTERN.test(mongodbDbName)) {
    issues.push('MONGODB_DB_NAME solo admite letras, números, guion y guion bajo.');
  }

  const jwtSecret = source.JWT_SECRET?.trim() ?? '';
  if (!jwtSecret) {
    issues.push('Falta la variable de entorno JWT_SECRET.');
  } else if (/<[^>]+>/.test(jwtSecret)) {
    issues.push('JWT_SECRET todavía contiene el marcador de .env.example.');
  } else if (Buffer.byteLength(jwtSecret, 'utf8') < MIN_JWT_SECRET_BYTES) {
    issues.push(`JWT_SECRET debe contener al menos ${MIN_JWT_SECRET_BYTES} bytes.`);
  }

  const jwtExpiresIn = source.JWT_EXPIRES_IN?.trim() || '1h';
  if (!EXPIRATION_PATTERN.test(jwtExpiresIn)) {
    issues.push('JWT_EXPIRES_IN debe usar un formato como 15m, 1h o 7d.');
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return Object.freeze({
    PORT: port,
    MONGODB_URI: mongodbUri,
    MONGODB_DB_NAME: mongodbDbName,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_ISSUER: source.JWT_ISSUER?.trim() || 'task-api-express',
    JWT_AUDIENCE: source.JWT_AUDIENCE?.trim() || 'task-api-client'
  });
};

// La configuración se valida una sola vez, antes de atender cualquier solicitud.
const readEnvOrExit = (): AppEnv => {
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

export const env: AppEnv = readEnvOrExit();
