import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadTaskDetail } from '../src/task-detail.js';

const id = '67112bfe47963b2be12c43b1';
const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('desafío: vista de detalle /tasks/:id', () => {
  it('consulta GET /api/tasks/:id con Bearer y devuelve la tarea encontrada', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValueOnce(jsonResponse({
      data: {
        id,
        title: 'Documentar la liberación',
        status: 'pending',
        priority: 'high',
        createdAt: '2026-11-19T10:00:00.000Z',
        updatedAt: '2026-11-19T10:00:00.000Z'
      }
    }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const state = await loadTaskDetail(id, 'token-de-prueba');
    expect(state).toMatchObject({ kind: 'found', task: { id, priority: 'high' } });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toMatch(new RegExp(`/api/tasks/${id}$`));
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token-de-prueba');
  });

  it('distingue 404 de una tarea inexistente con su requestId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({
      error: { code: 'TASK_NOT_FOUND', message: 'La tarea no existe.', requestId: 'req-404' }
    }, 404)));

    await expect(loadTaskDetail(id, 'token')).resolves.toEqual({
      kind: 'not-found',
      message: 'La tarea no existe. Referencia: req-404.'
    });
  });

  it('marca 401 como sesión no válida para volver al acceso', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({
      error: { code: 'INVALID_TOKEN', message: 'El token no es válido o expiró.', requestId: 'req-401' }
    }, 401)));

    const state = await loadTaskDetail(id, 'token-vencido');
    expect(state.kind).toBe('unauthorized');
  });
});
