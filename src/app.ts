import express from 'express';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { requestContext } from './middlewares/request-context.middleware.js';
import { corsPolicy, securityHeaders } from './middlewares/security.middleware.js';
import { shutdownGuard } from './middlewares/shutdown-guard.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { taskRouter } from './routes/task.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(requestContext);
app.use(securityHeaders);
app.use(corsPolicy);
app.use(shutdownGuard);
app.use(express.json({ limit: '20kb' }));

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);

app.use(notFound);
app.use(errorHandler);
