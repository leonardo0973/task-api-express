import type { FormEvent } from 'react';
import type { TaskListQuery } from '../types.js';

interface TaskFiltersProps {
  value: TaskListQuery;
  busy: boolean;
  onChange: (next: TaskListQuery) => void;
  onApply: () => Promise<void>;
}

// Cada cambio vuelve a la página 1 para no pedir páginas inexistentes.
// Los valores coinciden con las validaciones de A8 (búsqueda máx. 60).
export function TaskFilters({ value, busy, onChange, onApply }: TaskFiltersProps) {
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onApply();
  };

  return (
    <form className="filter-grid" onSubmit={submit}>
      <div>
        <label htmlFor="search">Buscar</label>
        <input
          id="search"
          value={value.search}
          onChange={(event) => onChange({ ...value, page: 1, search: event.target.value })}
          maxLength={60}
          placeholder="Texto del título"
        />
      </div>
      <div>
        <label htmlFor="status">Estado</label>
        <select
          id="status"
          value={value.status}
          onChange={(event) => onChange({
            ...value,
            page: 1,
            status: event.target.value as TaskListQuery['status']
          })}
        >
          <option value="">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="completed">Completadas</option>
        </select>
      </div>
      <div>
        <label htmlFor="sortBy">Ordenar por</label>
        <select
          id="sortBy"
          value={value.sortBy}
          onChange={(event) => onChange({
            ...value,
            page: 1,
            sortBy: event.target.value as TaskListQuery['sortBy']
          })}
        >
          <option value="createdAt">Creación</option>
          <option value="updatedAt">Actualización</option>
          <option value="title">Título</option>
          <option value="status">Estado</option>
        </select>
      </div>
      <div>
        <label htmlFor="order">Dirección</label>
        <select
          id="order"
          value={value.order}
          onChange={(event) => onChange({
            ...value,
            page: 1,
            order: event.target.value as TaskListQuery['order']
          })}
        >
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </div>
      <button type="submit" disabled={busy}>Aplicar</button>
    </form>
  );
}
