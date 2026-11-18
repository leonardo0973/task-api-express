import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task, TaskPriority, TaskUpdate } from '../src/models/task.js';
import type { User } from '../src/models/user.js';
import type {
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult
} from '../src/types/auth.js';
import type { TaskListQuery, TaskListResult } from '../src/types/task-query.js';

// Dobles de servicio: reemplazan la capa que toca MongoDB. Rutas, middleware,
// validaciones, token.service y el errorHandler siguen siendo los reales.
const authServiceDoubles = vi.hoisted(() => ({
  registerUser: vi.fn<(input: RegisterInput) => Promise<RegisterResult>>(),
  loginUser: vi.fn<(input: LoginInput) => Promise<LoginResult>>(),
  getAuthenticatedUser: vi.fn<(userId: string) => Promise<User>>()
}));

const taskServiceDoubles = vi.hoisted(() => ({
  listTasks: vi.fn<(query: TaskListQuery) => Promise<TaskListResult>>(),
  findTaskById: vi.fn<(id: string) => Promise<Task>>(),
  createTask: vi.fn<(title: string, priority?: TaskPriority) => Promise<Task>>(),
  updateTask: vi.fn<(id: string, changes: TaskUpdate) => Promise<Task>>(),
  completeTask: vi.fn<(id: string) => Promise<Task>>(),
  deleteTask: vi.fn<(id: string) => Promise<void>>()
}));

vi.mock('../src/services/auth.service.js', () => authServiceDoubles);
vi.mock('../src/services/task.service.js', () => taskServiceDoubles);

import { app } from '../src/app.js';
import { createAccessToken } from '../src/services/token.service.js';

const user: User = {
  id: '67112bfe47963b2be12c43a1',
  name: 'Ana Torres',
  email: 'ana.torres@example.com',
  role: 'user',
  createdAt: new Date('2026-10-01T12:00:00.000Z'),
  updatedAt: new Date('2026-10-01T12:00:00.000Z')
};

const admin: User = { ...user, id: '67112bfe47963b2be12c43a2', role: 'admin' };

const task: Task = {
  id: '67112bfe47963b2be12c43b1',
  title: 'Ejecutar pruebas automatizadas',
  status: 'pending',
  priority: 'medium',
  createdAt: new Date('2026-10-02T12:00:00.000Z'),
  updatedAt: new Date('2026-10-02T12:00:00.000Z')
};

let userToken = '';
let adminToken = '';

beforeEach(async () => {
  vi.clearAllMocks();
  userToken = await createAccessToken(user);
  adminToken = await createAccessToken(admin);

  authServiceDoubles.registerUser.mockResolvedValue({ user });
  authServiceDoubles.loginUser.mockResolvedValue({
    user,
    accessToken: userToken,
    tokenType: 'Bearer',
    expiresIn: '1h'
  });
  authServiceDoubles.getAuthenticatedUser.mockResolvedValue(user);

  taskServiceDoubles.listTasks.mockResolvedValue({
    data: [task],
    meta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    }
  });
  taskServiceDoubles.findTaskById.mockResolvedValue(task);
  taskServiceDoubles.createTask.mockResolvedValue(task);
  taskServiceDoubles.updateTask.mockResolvedValue(task);
  taskServiceDoubles.completeTask.mockResolvedValue({ ...task, status: 'completed' });
  taskServiceDoubles.deleteTask.mockResolvedValue();
});

describe('documentación y controles HTTP', () => {
  it('publica OpenAPI, Swagger UI y encabezados de seguridad', async () => {
    const health = await request(app).get('/health').expect(200);
    expect(health.body.status).toBe('ok');
    expect(health.headers['x-powered-by']).toBeUndefined();
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(typeof health.headers['x-request-id']).toBe('string');

    const specification = await request(app).get('/api-docs.json').expect(200);
    expect(specification.body.openapi).toBe('3.1.0');
    expect(specification.body.paths['/api/auth/me']).toBeDefined();
    expect(specification.body.components.securitySchemes.bearerAuth.scheme).toBe('bearer');

    const swagger = await request(app).get('/api-docs/').expect(200);
    expect(swagger.headers['content-type']).toContain('text/html');
    expect(swagger.text).toContain('<title>Task API Express</title>');
    expect(swagger.text).toContain('id="swagger-ui"');
  });
});

describe('autenticación e identidad', () => {
  it('registra, autentica y consulta /me sin exponer el hash', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ana Torres',
        email: 'ana.torres@example.com',
        password: 'Frase segura para clase 2026'
      })
      .expect(201);
    expect(registration.body.data.user.passwordHash).toBeUndefined();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana.torres@example.com', password: 'Frase segura para clase 2026' })
      .expect(200);
    expect(login.body.data.tokenType).toBe('Bearer');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(me.body.data.user.email).toBe(user.email);
    expect(me.body.data.user.passwordHash).toBeUndefined();
    expect(authServiceDoubles.getAuthenticatedUser).toHaveBeenCalledWith(user.id);
  });

  it('rechaza /me y las tareas cuando falta el token', async () => {
    const me = await request(app).get('/api/auth/me').expect(401);
    expect(me.body.error.code).toBe('AUTHENTICATION_REQUIRED');

    const taskList = await request(app).get('/api/tasks').expect(401);
    expect(taskList.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});

describe('CRUD protegido y autorización', () => {
  it('envía al servicio la consulta validada y crea una tarea', async () => {
    const list = await request(app)
      .get('/api/tasks?page=1&limit=10&status=pending&search=pruebas&sortBy=title&order=asc')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(taskServiceDoubles.listTasks).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: 'pending',
      search: 'pruebas',
      sortBy: 'title',
      order: 'asc'
    });

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: task.title })
      .expect(201);
    expect(created.body.data.title).toBe(task.title);
    expect(taskServiceDoubles.createTask).toHaveBeenCalledWith(task.title, undefined);
  });

  it('mantiene 403 para user y 204 para admin al eliminar', async () => {
    const forbidden = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');
    expect(taskServiceDoubles.deleteTask).not.toHaveBeenCalled();

    await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    expect(taskServiceDoubles.deleteTask).toHaveBeenCalledWith(task.id);
  });
});

describe('regresión y respuestas negativas', () => {
  it('conserva validación, CORS y contrato uniforme de error', async () => {
    const invalid = await request(app)
      .get('/api/tasks?page=0')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(422);
    expect(invalid.body.error.code).toBe('QUERY_VALIDATION_ERROR');
    expect(typeof invalid.body.error.requestId).toBe('string');
    expect(taskServiceDoubles.listTasks).not.toHaveBeenCalled();

    const allowedOrigin = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    expect(allowedOrigin.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const blockedOrigin = await request(app)
      .get('/health')
      .set('Origin', 'https://no-autorizado.example')
      .expect(200);
    expect(blockedOrigin.headers['access-control-allow-origin']).toBeUndefined();
  });
});

// Desafío individual A11: el formulario de React envía POST /api/tasks.
describe('desafío: crear tarea desde el cliente', () => {
  it('rechaza un título vacío con el error uniforme y no llama al servicio', async () => {
    const empty = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '   ' })
      .expect(422);
    expect(empty.body.error.code).toBe('VALIDATION_ERROR');
    expect(empty.body.error.details[0].field).toBe('title');
    expect(typeof empty.body.error.requestId).toBe('string');
    expect(taskServiceDoubles.createTask).not.toHaveBeenCalled();

    const withoutToken = await request(app)
      .post('/api/tasks')
      .send({ title: 'Sin token' })
      .expect(401);
    expect(withoutToken.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
