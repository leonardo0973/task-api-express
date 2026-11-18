import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiHttpError, apiRequest } from './api.js';
import type {
  ApiEnvelope,
  LoginData,
  Task,
  TaskListResponse,
  User
} from './types.js';

const TOKEN_KEY = 'task-api.access-token';
const MAX_TITLE_LENGTH = 120;

const messageFrom = (error: unknown): string => {
  if (error instanceof ApiHttpError) {
    const reference = error.requestId ? ` Referencia: ${error.requestId}.` : '';
    return `${error.message}${reference}`;
  }
  return 'No fue posible comunicarse con la API.';
};

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('Inicia sesión para consultar tus tareas.');
  const [busy, setBusy] = useState(false);

  // Desafío A11: formulario para crear tareas.
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const clearSession = useCallback((): void => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setTasks([]);
    setTotal(0);
  }, []);

  const loadProtectedData = useCallback(async (accessToken: string): Promise<void> => {
    try {
      setBusy(true);
      const [meResponse, taskResponse] = await Promise.all([
        apiRequest<ApiEnvelope<{ user: User }>>('/api/auth/me', {}, accessToken),
        apiRequest<TaskListResponse>(
          '/api/tasks?limit=10&sortBy=createdAt&order=desc',
          {},
          accessToken
        )
      ]);
      setUser(meResponse.data.user);
      setTasks(taskResponse.data);
      setTotal(taskResponse.meta.total);
      setMessage(`Se recuperaron ${taskResponse.meta.total} tareas.`);
    } catch (error: unknown) {
      if (error instanceof ApiHttpError && error.status === 401) clearSession();
      setMessage(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (token) void loadProtectedData(token);
  }, [loadProtectedData, token]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setMessage('Comprobando credenciales...');
    try {
      const response = await apiRequest<ApiEnvelope<LoginData>>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      sessionStorage.setItem(TOKEN_KEY, response.data.accessToken);
      setToken(response.data.accessToken);
      setPassword('');
    } catch (error: unknown) {
      setMessage(messageFrom(error));
      setBusy(false);
    }
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setCreateError('Escribe un título para la tarea.');
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      setCreateError(`El título no debe superar ${MAX_TITLE_LENGTH} caracteres.`);
      return;
    }
    if (!token) return;

    setCreating(true);
    setCreateError(null);
    try {
      const response = await apiRequest<ApiEnvelope<Task>>(
        '/api/tasks',
        { method: 'POST', body: JSON.stringify({ title }) },
        token
      );
      // Respuesta 201: la tarea nueva aparece primero sin recargar la página.
      setTasks((current) => [response.data, ...current].slice(0, 10));
      setTotal((current) => current + 1);
      setNewTitle('');
      setMessage(`Se creó la tarea "${response.data.title}".`);
    } catch (error: unknown) {
      if (error instanceof ApiHttpError && error.status === 401) clearSession();
      setCreateError(messageFrom(error));
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = (): void => {
    clearSession();
    setMessage('La sesión local se eliminó.');
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">EC3 F2 A11</p>
          <h1>Task API Client</h1>
          <p>Integración inicial de React con una API protegida por JWT.</p>
        </div>
        {user && <button onClick={handleLogout}>Cerrar sesión</button>}
      </header>

      {!token ? (
        <section className="panel login-panel" aria-labelledby="login-title">
          <h2 id="login-title">Iniciar sesión</h2>
          <form onSubmit={(event) => void handleLogin(event)}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </section>
      ) : (
        <section className="workspace" aria-busy={busy}>
          <article className="panel identity-panel">
            <h2>Identidad autenticada</h2>
            {user ? (
              <dl>
                <div><dt>Nombre</dt><dd>{user.name}</dd></div>
                <div><dt>Correo</dt><dd>{user.email}</dd></div>
                <div><dt>Rol</dt><dd>{user.role}</dd></div>
              </dl>
            ) : <p>Validando el token...</p>}
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Tareas recuperadas</h2>
              <button
                onClick={() => token && void loadProtectedData(token)}
                disabled={busy}
              >
                Actualizar
              </button>
            </div>

            <form
              className="create-task"
              onSubmit={(event) => void handleCreateTask(event)}
              noValidate
            >
              <label htmlFor="new-title">Nueva tarea</label>
              <div className="create-task-row">
                <input
                  id="new-title"
                  type="text"
                  value={newTitle}
                  maxLength={MAX_TITLE_LENGTH}
                  placeholder="Por ejemplo: Documentar la API"
                  onChange={(event) => {
                    setNewTitle(event.target.value);
                    if (createError) setCreateError(null);
                  }}
                  aria-invalid={createError !== null}
                  aria-describedby={createError ? 'create-error' : undefined}
                />
                <button type="submit" disabled={creating || busy}>
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
              {createError && (
                <p id="create-error" className="form-error" role="alert">{createError}</p>
              )}
            </form>

            {tasks.length === 0 ? (
              <p>No hay tareas para mostrar.</p>
            ) : (
              <ul className="task-list">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <span>{task.title}</span>
                    <strong>{task.status}</strong>
                  </li>
                ))}
              </ul>
            )}
            <p className="task-total">Total en la API: {total}</p>
          </article>
        </section>
      )}

      <p className="status-message" role="status">{message}</p>
    </main>
  );
}
