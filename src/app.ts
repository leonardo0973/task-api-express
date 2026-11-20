import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { requestContext } from './middlewares/request-context.middleware.js';
import {
  corsPolicy,
  documentationSecurityHeaders,
  securityHeaders
} from './middlewares/security.middleware.js';
import { shutdownGuard } from './middlewares/shutdown-guard.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { taskRouter } from './routes/task.routes.js';

export const app = express();

app.disable('x-powered-by');
// Detrás del proxy HTTPS de Render hay exactamente un salto (TRUST_PROXY_HOPS=1).
// En local vale 0: Express no confía en X-Forwarded-For de cualquier cliente.
if (env.TRUST_PROXY_HOPS > 0) app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.use(requestContext);

// Documentación: cabeceras de Helmet sin CSP, solo en estas dos rutas.
app.get(
  '/api-docs.json',
  documentationSecurityHeaders,
  (_req, res): void => {
    res.status(200).json(openApiDocument);
  }
);
app.use(
  '/api-docs',
  documentationSecurityHeaders,
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, { customSiteTitle: 'Task API Express' })
);

app.use(securityHeaders);
app.use(corsPolicy);
app.use(shutdownGuard);
app.use(express.json({ limit: '20kb' }));

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);

app.use(notFound);
app.use(errorHandler);
