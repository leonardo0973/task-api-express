// Traduce errores del driver de MongoDB a mensajes seguros.
// Los mensajes originales pueden contener host, usuario o la URI,
// por lo que nunca se imprimen ni se envían al cliente.

const readString = (value: unknown, key: string): string => {
  if (typeof value === 'object' && value !== null && key in value) {
    const field = (value as Record<string, unknown>)[key];
    return typeof field === 'string' ? field : '';
  }
  return '';
};

const readNumber = (value: unknown, key: string): number | undefined => {
  if (typeof value === 'object' && value !== null && key in value) {
    const field = (value as Record<string, unknown>)[key];
    return typeof field === 'number' ? field : undefined;
  }
  return undefined;
};

export const isMongoError = (error: unknown): boolean => {
  const name = readString(error, 'name');
  return name.startsWith('Mongo') || name.startsWith('Mongoose');
};

export const describeDatabaseError = (error: unknown): string => {
  const name = readString(error, 'name');
  const message = readString(error, 'message').toLowerCase();
  const code = readNumber(error, 'code');
  const syscall = readString(error, 'syscall');

  if (code === 18 || code === 8000 || message.includes('auth')) {
    return 'MongoDB Atlas rechazó la autenticación. Revisa el usuario y la contraseña de MONGODB_URI en .env.';
  }

  if (syscall.startsWith('query') || message.includes('enotfound')) {
    return 'No se pudo resolver el clúster de MongoDB Atlas. Revisa MONGODB_URI y tu conexión a internet.';
  }

  if (name === 'MongoParseError' || name === 'MongoAPIError') {
    return 'MONGODB_URI tiene un formato inválido.';
  }

  if (name.includes('ServerSelection') || name === 'MongoNetworkError' || name.includes('Timeout')) {
    return 'No se pudo alcanzar MongoDB Atlas. Verifica tu conexión y que tu IP esté autorizada en Network Access.';
  }

  return `Error al comunicarse con MongoDB (${name || 'desconocido'}).`;
};
