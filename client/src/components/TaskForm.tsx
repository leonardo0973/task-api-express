import { useState, type FormEvent } from 'react';
import type { TaskPriority } from '../types.js';

const MAX_TITLE_LENGTH = 120;

interface TaskFormProps {
  busy: boolean;
  onCreate: (title: string, priority: TaskPriority) => Promise<boolean>;
}

// Normaliza el título antes de enviarlo. El máximo coincide con el backend.
export function TaskForm({ busy, onCreate }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const normalized = title.trim();
    if (!normalized) {
      setError('Escribe un título para la tarea.');
      return;
    }
    if (normalized.length > MAX_TITLE_LENGTH) {
      setError(`El título no debe superar ${MAX_TITLE_LENGTH} caracteres.`);
      return;
    }
    setError(null);
    if (await onCreate(normalized, priority)) {
      setTitle('');
      setPriority('medium');
    }
  };

  return (
    <form className="inline-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="grow-field">
        <label htmlFor="new-title">Nueva tarea</label>
        <input
          id="new-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError(null);
          }}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Ejemplo: documentar la liberación"
          aria-invalid={error !== null}
          aria-describedby={error ? 'new-title-error' : undefined}
        />
      </div>
      <div>
        <label htmlFor="new-priority">Prioridad</label>
        <select
          id="new-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>
      <button type="submit" disabled={busy}>Crear</button>
      {error && (
        <p id="new-title-error" className="form-error" role="alert">{error}</p>
      )}
    </form>
  );
}
