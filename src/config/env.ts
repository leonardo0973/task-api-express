// Lee y valida las variables de entorno al cargar el proceso.
// Los mensajes indican el nombre de la variable, pero nunca imprimen su valor.
import 'dotenv/config';

export type AppEnvironment = 'development' | 'test' | 'production';

export interface AppEnv {
  NODE_ENV: AppEnvironment;
  APP_VERSION: string;
  PORT: number;
  PUBLIC_API_URL: string;
  TRUST_PROXY_HOPS: number;
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  CORS_ORIGIN: string;
  AUTH_RATE_LIMIT_WINDOW_MS: number;
  AUTH_RATE_LIMIT_MAX: number;
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
// Origen exacto: esquema, host y puerto opcional, sin ruta ni barra final.
const ORIGIN_PATTERN = /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?$/;

// Rechaza cero, negativos, decimales y texto para no aceptar límites ambiguos.
const parsePositiveInteger = (
  source: NodeJS.ProcessEnv,
  name: string,
  fallback: string,
  issues: string[]
): number => {
  const raw = source[name]?.trim() || fallback;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(value) || value < 1) {
    issues.push(`${name} debe ser un número entero mayor que cero.`);
  }
  return value;
};

// Acepta cero (sin proxy en local); rechaza negativos, decimales y texto.
const parseNonNegativeInteger = (
  source: NodeJS.ProcessEnv,
  name: string,
  fallback: string,
  issues: string[]
): number => {
  const raw = source[name]?.trim() || fallback;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(value) || value < 0) {
    issues.push(`${name} debe ser un número entero mayor o igual que cero.`);
  }
  return value;
};

const ENVIRONMENTS: readonly AppEnvironment[] = ['development', 'test', 'production'];

const isEnvironment = (value: string): value is AppEnvironment =>
  ENVIRONMENTS.some((environment) => environment === value);

// URL absoluta http o https; se guarda sin diagonal final.
const parseHttpUrl = (
  source: NodeJS.ProcessEnv,
  name: string,
  issues: string[]
): string => {
  const value = (source[name]?.trim() ?? '').replace(/\/+$/, '');
  if (!value) {
    issues.push(`Falta la variable de entorno ${name}.`);
    return value;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      issues.push(`${name} debe utilizar http o https.`);
    }
  } catch {
    issues.push(`${name} debe ser una URL absoluta válida.`);
  }
  return value;
};

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): AppEnv => {
  const issues: string[] = [];

  const nodeEnv = source.NODE_ENV?.trim() || 'development';
  if (!isEnvironment(nodeEnv)) {
    issues.push('NODE_ENV debe ser development, test o production.');
  }
  const appVersion = source.APP_VERSION?.trim() || '1.0.0';
  const publicApiUrl = parseHttpUrl(source, 'PUBLIC_API_URL', issues);
  const trustProxyHops = parseNonNegativeInteger(source, 'TRUST_PROXY_HOPS', '0', issues);

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

  const corsOrigin = (source.CORS_ORIGIN?.trim() ?? '').replace(/\/+$/, '');
  if (!corsOrigin) {
    issues.push('Falta la variable de entorno CORS_ORIGIN.');
  } else if (corsOrigin === '*' || !ORIGIN_PATTERN.test(corsOrigin)) {
    issues.push('CORS_ORIGIN debe ser un origen exacto como http://localhost:5173 (sin * ni ruta final).');
  }

  const authRateLimitWindowMs = parsePositiveInteger(source, 'AUTH_RATE_LIMIT_WINDOW_MS', '900000', issues);
  const authRateLimitMax = parsePositiveInteger(source, 'AUTH_RATE_LIMIT_MAX', '10', issues);

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return Object.freeze({
    NODE_ENV: isEnvironment(nodeEnv) ? nodeEnv : 'development',
    APP_VERSION: appVersion,
    PORT: port,
    PUBLIC_API_URL: publicApiUrl,
    TRUST_PROXY_HOPS: trustProxyHops,
    MONGODB_URI: mongodbUri,
    MONGODB_DB_NAME: mongodbDbName,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_ISSUER: source.JWT_ISSUER?.trim() || 'task-api-express',
    JWT_AUDIENCE: source.JWT_AUDIENCE?.trim() || 'task-api-client',
    CORS_ORIGIN: corsOrigin,
    AUTH_RATE_LIMIT_WINDOW_MS: authRateLimitWindowMs,
    AUTH_RATE_LIMIT_MAX: authRateLimitMax
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
