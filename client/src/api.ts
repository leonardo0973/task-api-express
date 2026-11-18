import type { ApiErrorData } from './types.js';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  ''
);

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ApiHttpError';
  }
}

const isErrorEnvelope = (value: unknown): value is { error: ApiErrorData } => {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = value.error;
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof error.code === 'string'
    && 'message' in error
    && typeof error.message === 'string';
};

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await response.text();
  let payload: unknown;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new ApiHttpError(
        response.status,
        'INVALID_SERVER_RESPONSE',
        'La API devolvió una respuesta que no es JSON.'
      );
    }
  }

  if (!response.ok) {
    if (isErrorEnvelope(payload)) {
      throw new ApiHttpError(
        response.status,
        payload.error.code,
        payload.error.message,
        payload.error.requestId
      );
    }
    throw new ApiHttpError(
      response.status,
      'HTTP_ERROR',
      `La solicitud terminó con el código ${response.status}.`
    );
  }

  return payload as T;
};
