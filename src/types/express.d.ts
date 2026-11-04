import type { AccessTokenSubject } from './auth.js';

declare global {
  namespace Express {
    interface Locals {
      // Opcional: /health, registro y login no ejecutan authenticate.
      auth?: AccessTokenSubject;
    }
  }
}

export {};
