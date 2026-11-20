import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { loadTaskDetail, type TaskDetailState } from '../task-detail.js';

interface TaskDetailProps {
  token: string;
  onUnauthorized: (message: string) => void;
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

const PRIORITY_LABEL = { low: 'baja', medium: 'media', high: 'alta' } as const;

// Ruta /tasks/:id. Una recarga directa funciona gracias a la reescritura SPA
// de render.yaml (/* -> /index.html) y al servidor de desarrollo de Vite.
export function TaskDetail({ token, onUnauthorized }: TaskDetailProps) {
  const { id = '' } = useParams();
  const [state, setState] = useState<TaskDetailState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    void loadTaskDetail(id, token).then((next) => {
      if (!active) return;
      setState(next);
      if (next.kind === 'unauthorized') onUnauthorized(next.message);
    });
    return () => { active = false; };
  }, [id, token, onUnauthorized]);

  return (
    <article className="panel detail-panel" aria-busy={state.kind === 'loading'}>
      <Link className="back-link" to="/">← Volver a la lista</Link>
      {state.kind === 'loading' && <p role="status">Cargando la tarea...</p>}
      {state.kind === 'found' && (
        <>
          <h2>{state.task.title}</h2>
          <dl className="detail-list">
            <div><dt>Estado</dt><dd><span className={`badge ${state.task.status}`}>{state.task.status}</span></dd></div>
            <div><dt>Prioridad</dt><dd>{PRIORITY_LABEL[state.task.priority]}</dd></div>
            <div><dt>Creada</dt><dd>{formatDate(state.task.createdAt)}</dd></div>
            <div><dt>Actualizada</dt><dd>{formatDate(state.task.updatedAt)}</dd></div>
            <div><dt>Identificador</dt><dd><code>{state.task.id}</code></dd></div>
          </dl>
        </>
      )}
      {state.kind === 'not-found' && (
        <>
          <h2>Tarea no encontrada (404)</h2>
          <p role="alert">{state.message}</p>
        </>
      )}
      {state.kind === 'invalid-id' && (
        <>
          <h2>Identificador inválido</h2>
          <p role="alert">{state.message}</p>
        </>
      )}
      {state.kind === 'unauthorized' && (
        <>
          <h2>Sesión no válida (401)</h2>
          <p role="alert">{state.message} Vuelve a iniciar sesión.</p>
        </>
      )}
      {state.kind === 'error' && <p role="alert">{state.message}</p>}
    </article>
  );
}
