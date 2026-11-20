import { useCallback, useEffect, useState } from 'react';
import { ApiHttpError } from './api.js';
import { AuthPanel } from './components/AuthPanel.js';
import { TaskFilters } from './components/TaskFilters.js';
import { TaskForm } from './components/TaskForm.js';
import { TaskList } from './components/TaskList.js';
import {
  createTask,
  deleteTask,
  getMe,
  listTasks,
  login,
  register,
  updateTask
} from './task-api.js';
import type { PaginationMeta, Task, TaskListQuery, TaskPriority, User } from './types.js';

const TOKEN_KEY = 'task-api.access-token';
const INITIAL_QUERY: TaskListQuery = {
  page: 1,
  limit: 5,
  status: '',
  search: '',
  sortBy: 'createdAt',
  order: 'desc'
};

const messageFrom = (error: unknown): string => {
  if (error instanceof ApiHttpError) {
    const reference = error.requestId ? ` Referencia: ${error.requestId}.` : '';
    return `${error.message}${reference}`;
  }
  return 'No fue posible comunicarse con la API.';
};

const readStoredToken = (): string | null => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export default function App() {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [query, setQuery] = useState<TaskListQuery>(INITIAL_QUERY);
  const [message, setMessage] = useState('Inicia sesión o crea una cuenta.');
  const [busy, setBusy] = useState(false);

  const clearSession = useCallback((): void => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setTasks([]);
    setMeta(null);
  }, []);

  // Coordina el estado ocupado y convierte errores. Un 401 elimina la sesión.
  const run = useCallback(async (operation: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    try {
      await operation();
      return true;
    } catch (error: unknown) {
      if (error instanceof ApiHttpError && error.status === 401) clearSession();
      setMessage(messageFrom(error));
      return false;
    } finally {
      setBusy(false);
    }
  }, [clearSession]);

  const loadTasks = useCallback(async (
    accessToken: string,
    selectedQuery: TaskListQuery
  ): Promise<void> => {
    const response = await listTasks(selectedQuery, accessToken);
    setTasks(response.data);
    setMeta(response.meta);
    setMessage(`Se muestran ${response.data.length} de ${response.meta.total} tareas.`);
  }, []);

  const loadSession = useCallback(async (accessToken: string): Promise<void> => {
    await run(async () => {
      const me = await getMe(accessToken);
      setUser(me.data.user);
      setQuery(INITIAL_QUERY);
      await loadTasks(accessToken, INITIAL_QUERY);
    });
  }, [loadTasks, run]);

  useEffect(() => {
    if (token) void loadSession(token);
  }, [loadSession, token]);

  const saveToken = (accessToken: string): void => {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
  };

  const handleLogin = async (email: string, password: string): Promise<void> => {
    await run(async () => {
      const response = await login(email, password);
      saveToken(response.data.accessToken);
      setMessage('Sesión iniciada correctamente.');
    });
  };

  // El registro se completa con un login inmediato para obtener el token.
  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    await run(async () => {
      await register(name, email, password);
      const response = await login(email, password);
      saveToken(response.data.accessToken);
      setMessage('Cuenta creada. La sesión quedó iniciada.');
    });
  };

  const refresh = async (selectedQuery: TaskListQuery = query): Promise<void> => {
    if (!token) return;
    await run(() => loadTasks(token, selectedQuery));
  };

  // Después de cada cambio se vuelve a consultar el servidor.
  const handleCreate = async (title: string, priority: TaskPriority): Promise<boolean> => {
    if (!token) return false;
    return run(async () => {
      await createTask({ title, priority }, token);
      const firstPage = { ...query, page: 1 };
      setQuery(firstPage);
      await loadTasks(token, firstPage);
      setMessage(`Se creó la tarea "${title}".`);
    });
  };

  const handleRename = async (task: Task, title: string): Promise<void> => {
    if (!token) return;
    await run(async () => {
      await updateTask(task.id, { title }, token);
      await loadTasks(token, query);
      setMessage('El título se actualizó correctamente.');
    });
  };

  const handleToggle = async (task: Task): Promise<void> => {
    if (!token) return;
    await run(async () => {
      const status = task.status === 'pending' ? 'completed' : 'pending';
      await updateTask(task.id, { status }, token);
      await loadTasks(token, query);
      setMessage('El estado se actualizó correctamente.');
    });
  };

  const handleDelete = async (task: Task): Promise<void> => {
    if (!token || !window.confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
    await run(async () => {
      await deleteTask(task.id, token);
      await loadTasks(token, query);
      setMessage('La tarea se eliminó correctamente.');
    });
  };

  const changePage = async (page: number): Promise<void> => {
    const next = { ...query, page };
    setQuery(next);
    await refresh(next);
  };

  const handleLogout = (): void => {
    clearSession();
    setMessage('La sesión local se eliminó.');
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">EC3 F3 A12</p>
          <h1>Task API Client</h1>
          <p>Cliente CRUD integrado con la API de producción.</p>
        </div>
        {user && <button onClick={handleLogout}>Cerrar sesión</button>}
      </header>

      {!token ? (
        <AuthPanel busy={busy} onLogin={handleLogin} onRegister={handleRegister} />
      ) : (
        <section aria-busy={busy}>
          <article className="panel identity-panel">
            <div>
              <h2>{user ? `Hola, ${user.name}` : 'Validando tu sesión...'}</h2>
              {user && <p>{user.email} · rol <strong>{user.role}</strong></p>}
            </div>
            <button className="secondary" onClick={() => void refresh()} disabled={busy}>
              Actualizar
            </button>
          </article>

          <article className="panel">
            <h2>Gestionar tareas</h2>
            <TaskForm busy={busy} onCreate={handleCreate} />
            <hr />
            <TaskFilters
              value={query}
              busy={busy}
              onChange={setQuery}
              onApply={() => refresh()}
            />
            <TaskList
              tasks={tasks}
              canDelete={user?.role === 'admin'}
              busy={busy}
              onRename={handleRename}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
            {meta && (
              <nav className="pagination" aria-label="Paginación de tareas">
                <button
                  className="secondary"
                  disabled={busy || !meta.hasPreviousPage}
                  onClick={() => void changePage(meta.page - 1)}
                >
                  Anterior
                </button>
                <span>Página {meta.page} de {Math.max(meta.totalPages, 1)} · {meta.total} tareas</span>
                <button
                  className="secondary"
                  disabled={busy || !meta.hasNextPage}
                  onClick={() => void changePage(meta.page + 1)}
                >
                  Siguiente
                </button>
              </nav>
            )}
          </article>
        </section>
      )}

      <p className="status-message" role="status" aria-live="polite">{message}</p>
    </main>
  );
}
