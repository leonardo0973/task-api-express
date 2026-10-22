// Lee y valida las variables de entorno antes de iniciar la API.
// Los mensajes nunca incluyen el valor recibido para no exponer secretos.

export interface AppEnv {
  port: number;
  mongodbUri: string;
  mongodbDbName: string;
}

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super('Configuración de entorno inválida.');
    this.name = 'EnvValidationError';
  }
}

const DB_NAME_PATTERN = /^[A-Za-z0-9_-]{1,63}$/;

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): AppEnv => {
  const issues: string[] = [];

  const portValue = Number(source.PORT ?? 3000);
  if (!Number.isInteger(portValue) || portValue <= 0 || portValue > 65535) {
    issues.push('PORT debe ser un entero entre 1 y 65535.');
  }

  const mongodbUri = source.MONGODB_URI?.trim() ?? '';
  if (!mongodbUri) {
    issues.push('MONGODB_URI es obligatoria. Defínela en el archivo .env.');
  } else if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
    issues.push('MONGODB_URI debe comenzar con mongodb+srv:// o mongodb://.');
  } else if (/<[^>]+>/.test(mongodbUri)) {
    issues.push('MONGODB_URI todavía contiene marcadores como <usuario> o <contraseña>.');
  }

  const mongodbDbName = source.MONGODB_DB_NAME?.trim() ?? '';
  if (!mongodbDbName) {
    issues.push('MONGODB_DB_NAME es obligatoria. Defínela en el archivo .env.');
  } else if (!DB_NAME_PATTERN.test(mongodbDbName)) {
    issues.push('MONGODB_DB_NAME solo admite letras, números, guion y guion bajo.');
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return Object.freeze({ port: portValue, mongodbUri, mongodbDbName });
};
