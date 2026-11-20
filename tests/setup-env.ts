// Valores de prueba no sensibles: se cargan antes de importar la aplicación.
// La URI apunta a localhost, pero los servicios se simulan y nunca se abre conexión.
process.env.NODE_ENV = 'test';
process.env.APP_VERSION = '1.0.0-test';
process.env.PORT = '3000';
process.env.PUBLIC_API_URL = 'http://localhost:3000';
process.env.TRUST_PROXY_HOPS = '0';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/task_api_test';
process.env.MONGODB_DB_NAME = 'task_api_test';
process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_ISSUER = 'task-api-express';
process.env.JWT_AUDIENCE = 'task-api-client';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '900000';
process.env.AUTH_RATE_LIMIT_MAX = '100';
