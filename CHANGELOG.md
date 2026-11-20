# Historial de cambios

Todas las versiones de task-api-express. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la numeración
[Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-11-19

### Agregado

- Cliente React con registro, inicio y cierre de sesión.
- Operaciones de creación, consulta, edición de título, cambio de estado y eliminación por rol desde la interfaz.
- Filtros, búsqueda, ordenamiento y paginación desde la interfaz.
- Pruebas del adaptador HTTP del cliente (consulta y Bearer, respuesta 204 y contrato de error).
- `GET /health` informa `status`, `version` y `environment`; `GET /health/database` responde 200 `up` o 503 `down`.
- OpenAPI toma su versión de `APP_VERSION` y su servidor de `PUBLIC_API_URL`.
- Configuración reproducible de despliegue mediante `render.yaml` (servicio Node y sitio estático).
- Prueba de humo `pnpm smoke:release` para verificar una liberación sin revelar credenciales.

### Conservado

- TypeScript estricto, módulos ECMAScript y resolución NodeNext en el backend.
- Persistencia con Mongoose 8.24.6 y MongoDB Atlas.
- Contrato uniforme de respuestas y errores con `requestId`.
- JWT, roles `user` y `admin`, Helmet, CORS, limitación de solicitudes y OpenAPI 3.1.

### Seguridad

- Secretos únicamente mediante variables de entorno (Render y `.env` local, nunca en Git).
- Origen CORS específico en producción.
- Configuración explícita del proxy de confianza (`TRUST_PROXY_HOPS`: 0 en local, 1 en Render).
- La API escucha en `0.0.0.0` y en el puerto asignado por el proveedor.
