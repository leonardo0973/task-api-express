# Task API Express

API REST de gestión de tareas construida con **Express 5**, **TypeScript**, **PNPM** y **Mongoose 8**, conectada de forma segura con **MongoDB Atlas**. Incluye autenticación JWT con roles (EC3 A9–A10), pruebas automatizadas, OpenAPI/Swagger UI y un cliente React (EC3 F2 A11), y la liberación **1.0.0** desplegada en Render con un cliente CRUD completo (EC3 F3 A12). Desde **EC2 F2 A7** el módulo de tareas cubre el CRUD completo sobre MongoDB Atlas mediante `TaskModel` (identificadores `ObjectId` y `timestamps`), con una actualización parcial general `PATCH /api/tasks/:id` que modifica `title`, `status` y `priority` sin sobrescribir los campos que no se envían.

## Requisitos

- Node.js 20 o superior
- PNPM 9 o superior
- Cuenta de MongoDB Atlas con un clúster (el nivel gratuito M0 es suficiente)
- Postman para las pruebas

## Variables de entorno

Copia `.env.example` como `.env` y completa los valores. **`.env` nunca se sube a Git.**

| Variable | Obligatoria | Descripción |
|---|---|---|
| `NODE_ENV` | No (`development`) | `development`, `test` o `production`. |
| `APP_VERSION` | No (`1.0.0`) | Versión publicada en `/health` y en OpenAPI. |
| `PORT` | No (3000) | Puerto HTTP de la API. Entero entre 1 y 65535. Render lo asigna. |
| `PUBLIC_API_URL` | Sí | URL pública de la API sin diagonal final (`http://localhost:3000` en local, HTTPS en Render). La usa Swagger UI. |
| `TRUST_PROXY_HOPS` | No (`0`) | Saltos de proxy de confianza: `0` en local, `1` detrás del proxy de Render. |
| `MONGODB_URI` | Sí | Cadena `mongodb+srv://` del clúster de Atlas con el usuario exclusivo de la API. |
| `MONGODB_DB_NAME` | Sí | Base de datos de la API: `task_api`. |
| `JWT_SECRET` | Sí | Clave aleatoria de al menos 32 bytes para firmar los JWT (HS256). |
| `JWT_EXPIRES_IN` | No (`1h`) | Vigencia del token: número seguido de `s`, `m`, `h` o `d`. |
| `JWT_ISSUER` | No (`task-api-express`) | Emisor que se firma y se exige al verificar. |
| `JWT_AUDIENCE` | No (`task-api-client`) | Audiencia que se firma y se exige al verificar. |
| `CORS_ORIGIN` | Sí | Origen exacto del frontend permitido por CORS (por ejemplo `http://localhost:5173`). |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No (`900000`) | Ventana del límite de autenticación en milisegundos (15 min). |
| `AUTH_RATE_LIMIT_MAX` | No (`10`) | Solicitudes a `/api/auth` permitidas por IP en cada ventana. |

La API valida estas variables al arrancar. Si falta alguna o tiene formato incorrecto, se
detiene con un mensaje descriptivo sin mostrar valores reales.

## Configuración de MongoDB Atlas

1. Crea un proyecto y un despliegue gratuito (M0).
2. **Database Access** → *Add New Database User*:
   - Autenticación por contraseña (`task_api_user`).
   - *Specific Privileges* → rol `readWrite` sobre la base de datos `task_api` únicamente.
3. **Network Access** → autoriza solo la IP pública de tu equipo (*Add Current IP Address*). No uses `0.0.0.0/0`.
4. **Connect → Drivers** → copia la cadena de conexión y colócala en `MONGODB_URI` dentro de `.env`.

## Instalación

```bash
pnpm install
```

## Ejecución

```bash
pnpm check   # Comprobación de tipos con TypeScript estricto
pnpm build   # Compila a dist/
pnpm dev     # Desarrollo con recarga automática
pnpm start   # Ejecuta la versión compilada
```

Al iniciar, la API **se conecta con MongoDB Atlas antes de abrir el puerto**:

```
[mongodb] Conectando con MongoDB Atlas...
[mongodb] Conexión establecida con la base de datos "task_api".
[server] API disponible en http://localhost:3000
```

Si Atlas no está disponible (credenciales incorrectas, IP no autorizada o sin red), la API
no abre el puerto y termina con código 1 mostrando un mensaje seguro.

## Rutas

### Salud

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | `200 { "data": { "status": "up", "version": "1.0.0", "environment": "production" } }` — el proceso está activo (A12). |
| GET | `/health/database` | `200 { "data": { "status": "up", ... } }` con ping, base de datos y latencia; `503 { "data": { "status": "down" } }` si MongoDB no responde. Render lo usa como health check. |

### Tareas (Persistentes en MongoDB Atlas)

| Método | Ruta | Éxito | Descripción |
|---|---|---|---|
| GET | `/api/tasks` | 200 | Lista paginada con `data` y `meta` (ver *Consultas del listado*). Sin parámetros conserva `createdAt asc`. |
| GET | `/api/tasks/:id` | 200 | Consulta una tarea por su ObjectId (24 caracteres hex). |
| POST | `/api/tasks` | 201 | Crea una tarea (`title` obligatorio, `priority` opcional; `status` inicia en `pending`). |
| PATCH | `/api/tasks/:id` | 200 | Actualización parcial de `title`, `status` y/o `priority` con `$set`, `new: true` y `runValidators: true`. |
| PATCH | `/api/tasks/:id/complete` | 200 | Ruta heredada: marca `completed` delegando en `updateTask`. |
| DELETE | `/api/tasks/:id` | 204 | Elimina el documento de la colección `tasks`. |

### Consultas del listado (EC2 F3 A8)

`GET /api/tasks?page=2&limit=5&status=pending&search=api&sortBy=title&order=asc`

| Parámetro | Predeterminado | Regla |
|---|---|---|
| `page` | 1 | Entero entre 1 y 100000. |
| `limit` | 10 | Entero entre 1 y 50. |
| `status` | sin filtro | `pending` o `completed`. |
| `search` | sin búsqueda | Texto no vacío de hasta 60 caracteres; búsqueda parcial en `title` sin distinguir mayúsculas (se escapan metacaracteres). |
| `sortBy` | `createdAt` | `createdAt`, `updatedAt`, `title` o `status`. |
| `order` | `asc` | `asc` o `desc`. |
| `createdFrom` / `createdTo` | sin rango | Fechas ISO 8601; `createdFrom` no puede ser posterior a `createdTo` (desafío). |

La respuesta incluye `meta: { page, limit, total, totalPages, hasNextPage, hasPreviousPage }`. Un parámetro
desconocido, repetido o inválido responde `422 QUERY_VALIDATION_ERROR` con `details` por campo.

### Autenticación (EC3 F1 A9)

| Método | Ruta | Éxito | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | 201 | Recibe `name`, `email`, `password` (15 caracteres a 72 bytes) y, de forma opcional, `confirmPassword` (si se envía debe coincidir). Devuelve `data.user` sin contraseña ni hash; el rol siempre es `user`. |
| POST | `/api/auth/login` | 200 | Recibe `email` y `password`. Devuelve `data.user`, `accessToken`, `tokenType: "Bearer"` y `expiresIn`. |

- Las contraseñas se guardan solo como hash bcrypt (12 rondas, `bcryptjs`); `passwordHash` tiene `select: false`.
- El JWT (`jose`, HS256) contiene únicamente `sub`, `role`, `iss`, `aud`, `iat` y `exp`.
- Errores: `409 USER_EMAIL_EXISTS`, `422 AUTH_VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (mismo mensaje para correo inexistente y contraseña incorrecta), `415`, `400 INVALID_JSON`.
- `GET /api/auth/me` requiere Bearer y devuelve `data.user` (usuario público actual, sin contraseña ni hash). El identificador se obtiene del JWT verificado; si la cuenta ya no existe responde 401 `AUTHENTICATED_USER_NOT_FOUND`.

### Protección y roles (EC3 F2 A10)

| Ruta | Pública | user | admin |
|---|---|---|---|
| `GET /health`, `POST /api/auth/register`, `POST /api/auth/login` | Sí | Sí | Sí |
| `GET/POST/PATCH /api/tasks...` | No (401) | Permitido | Permitido |
| `DELETE /api/tasks/:id` | No (401) | 403 `FORBIDDEN` | Permitido |

- Enviar `Authorization: Bearer <accessToken>`. Errores: `401 AUTHENTICATION_REQUIRED` (sin encabezado), `401 INVALID_AUTHORIZATION_HEADER` (formato incorrecto), `401 INVALID_TOKEN` (firma, emisor, audiencia o expiración), `403 FORBIDDEN` (rol sin permiso).
- Controles HTTP: Helmet (cabeceras de seguridad), CORS limitado a `CORS_ORIGIN` y límite de `AUTH_RATE_LIMIT_MAX` solicitudes por IP a `POST /api/auth/register` y `POST /api/auth/login` (`429 AUTH_RATE_LIMIT_EXCEEDED`). Desde A11, `GET /api/auth/me` no consume ese límite.
- Cambiar el rol de una cuenta (solo desde la terminal, no hay ruta HTTP): `pnpm role:set <correo> <user|admin>`. Después hay que iniciar sesión otra vez para recibir un token con el rol nuevo.

### Integración, despliegue y liberación (EC3 F3 A12)

```bash
pnpm install --frozen-lockfile
pnpm verify          # tipos, 7 pruebas backend, 3 pruebas cliente y ambos builds
pnpm dev             # API en http://localhost:3000 (Swagger en /api-docs)
pnpm client:dev      # React en http://localhost:5173
# Después del despliegue (PowerShell):
#   $env:API_URL='https://...'; $env:USER_EMAIL='...'; $env:USER_PASSWORD='...'; pnpm smoke:release
```

- **Cliente React CRUD** (`client/src/components`): registro, login, crear (con prioridad), listar, buscar, filtrar por estado, ordenar, paginar, editar título, completar o reabrir y eliminar (el botón solo aparece para `admin`; Express sigue respondiendo 403 a un `user`).
- **Producción**: la API escucha en `0.0.0.0:$PORT`, declara `trust proxy` con `TRUST_PROXY_HOPS` y publica versión y ambiente en `/health`.
- **Render**: `render.yaml` define el servicio Node `task-api-express-leonardo0973` y el sitio estático `task-client-react-leonardo0973` (con reescritura SPA). Las variables `sync: false` (`PUBLIC_API_URL`, `MONGODB_URI`, `CORS_ORIGIN`, `VITE_API_URL`) se capturan en Render y `JWT_SECRET` se genera allí.
- **Desafío (sin liberar)**: vista `/tasks/:id` con React Router; ver `CHANGELOG.md` → *Unreleased*.
- **Liberación**: `CHANGELOG.md`, `docs/release-checklist.md`, `docs/evidencias-a12.md`, `docs/reflexion-a12.md` y la etiqueta `v1.0.0`.

### Calidad, documentación e integración (EC3 F2 A11)

```bash
pnpm test          # Vitest + SuperTest (servicios reemplazados por dobles, sin Atlas)
pnpm verify        # check + test + build + client:check + client:build
pnpm client:dev    # Cliente React en http://localhost:5173 (la API debe estar en :3000)
```

- **Pruebas:** `tests/api.test.ts` cubre documentación, Helmet, registro, login, `/me`, 401, listado con filtros, creación, 403/204 por rol, 422, CORS y el desafío (título vacío → 422 sin llamar al servicio). Solo `auth.service` y `task.service` son dobles; rutas, middleware, JWT y `errorHandler` son reales.
- **OpenAPI 3.1:** `src/docs/openapi.ts`, publicado en `GET /api-docs.json`. **Swagger UI** en `http://localhost:3000/api-docs` (botón *Authorize* con el `accessToken`).
- **Cliente React** (`client/`, Vite + TypeScript): inicia sesión, guarda el token en `sessionStorage` (solución didáctica), consulta `/api/auth/me` y `/api/tasks`, borra la sesión ante 401 y muestra el `requestId` de los errores. Copia `client/.env.example` como `client/.env` (`VITE_API_URL=http://localhost:3000`).
- **Desafío:** formulario *Nueva tarea* en React (valida título vacío y máximo 120 caracteres, envía `POST /api/tasks` y agrega la tarea sin recargar) con su prueba automatizada.
- Evidencias: `evidencias/ec3-a11.md`, `evidencias/ec3-a11-reflexion.md`, `evidencias/capturas-a11/` y `postman/Task API EC3 F2 A11.postman_collection.json`.

### Actualización parcial

```http
PATCH /api/tasks/<OBJECT_ID>
Content-Type: application/json

{ "title": "Documentar las pruebas CRUD", "status": "completed" }
```

Campos permitidos: `title` (texto de 1 a 120 caracteres), `status` (`pending` | `completed`) y
`priority` (`low` | `medium` | `high`, predeterminado `medium`). Se rechazan con 422 el cuerpo
vacío, los arreglos y cualquier otro campo (`_id`, `id`, `createdAt`, `updatedAt`, `owner`...).

### Contrato de errores

```json
{
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "La base de datos no está disponible en este momento.",
    "requestId": "c0a8..."
  }
}
```

| Estado | Código | Descripción |
|---|---|---|
| 400 | `INVALID_ID`, `INVALID_JSON` | Identificador no conforme a ObjectId o sintaxis JSON rota. |
| 404 | `TASK_NOT_FOUND`, `ROUTE_NOT_FOUND` | ObjectId válido inexistente o ruta desconocida. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | POST o PATCH `/:id` sin `Content-Type: application/json`. |
| 422 | `VALIDATION_ERROR`, `PERSISTENCE_VALIDATION_ERROR` | Cuerpo vacío o no objeto, campo no permitido, título vacío o mayor de 120, `status` o `priority` fuera del enum. |
| 500 | `INTERNAL_ERROR` | Error imprevisto. |
| 503 | `DATABASE_UNAVAILABLE`, `SERVICE_UNAVAILABLE` | Falla de conexión a Atlas o cierre en curso. |

Cada respuesta incluye el encabezado `X-Request-Id`, que coincide con `error.requestId`.

## Cierre ordenado (*Graceful Shutdown*)

Al recibir `SIGINT` (Ctrl+C) o `SIGTERM` la API:
1. Deja de aceptar solicitudes nuevas (`503 SERVICE_UNAVAILABLE`).
2. Espera a que terminen las solicitudes en curso y cierra el servidor HTTP.
3. Desconecta MongoDB mediante `mongoose.disconnect()`.
4. Finaliza con código 0.

## Medidas de seguridad

- Las credenciales viven solo en `.env`, excluido por `.gitignore`.
- Usuario de Atlas exclusivo con `readWrite` limitado a `task_api`.
- Acceso de red restringido a la IP del equipo de desarrollo.
- La terminal y las respuestas nunca muestran la URI, la contraseña, el host, el stack ni objetos internos de Mongoose.
- Las contraseñas nunca se guardan ni se responden en texto plano; el cliente no puede enviar `role` ni `passwordHash`.
- `/api/tasks` exige JWT y solo `admin` elimina; Helmet, CORS con origen exacto y límite de intentos en autenticación.
- `JWT_SECRET` se genera con `randomBytes(32)` y solo existe en `.env`.
- Verificación: `git check-ignore .env` debe imprimir `.env` y `git ls-files .env` no debe imprimir nada.

## Estructura

```
src/
├── app.ts                      # Configuración de Express (trust proxy en A12)
├── server.ts                   # Valida entorno → conecta Atlas → abre puerto
├── config/env.ts               # Validación de variables de entorno
├── config/database.ts          # Conexión Mongoose a MongoDB Atlas
├── services/database.service.ts# Ping a Atlas para /health/database
├── services/task.service.ts    # Reglas de tareas y metadatos de paginación (A8)
├── services/auth.service.ts    # Registro, login (A9) e identidad autenticada /me (A11)
├── docs/openapi.ts             # Contrato OpenAPI 3.1 (A11)
├── services/password.service.ts# Hash y comparación bcrypt (A9)
├── services/token.service.ts   # Firma y verificación JWT (A9)
├── repositories/               # task.repository (Mongoose, A8) y user.repository (A9)
├── models/                     # task y user
├── types/                      # api-error, task-query (A8) y auth (A9)
├── services/task.service.ts    # Operaciones asíncronas con TaskModel
├── models/task.ts              # Esquema, TaskModel y tipos Task y TaskUpdate (title, status, priority)
├── controllers/                # health y task (funciones asíncronas)
├── routes/                     # health.routes y task.routes
├── middlewares/                # requestId, JSON, validación de id, title y actualización parcial, errores
├── errors/                     # AppError y describeDatabaseError
└── lifecycle/graceful-shutdown.ts
docs/
├── pruebas-conexion-mongodb.md      # EC2 F1 A5
├── pruebas-persistencia-mongodb.md  # EC2 F2 A6
├── pruebas-crud-mongodb.md          # EC2 F2 A7
├── pruebas-consultas-tareas.md      # EC2 F3 A8
├── evidencias-ec3-f1-a9.md          # EC3 F1 A9
├── capturas/                        # Capturas del Runner de Postman (sin secretos)
└── reflexion-*.md
postman/
├── Task API EC2 F1 A5.postman_collection.json
├── Task API EC2 F2 A6.postman_collection.json
├── Task API EC2 F2 A7.postman_collection.json
├── Task API EC2 F3 A8.postman_collection.json
├── Task API EC3 F1 A9.postman_collection.json
├── Task API EC3 F2 A10.postman_collection.json
├── Task API EC3 F2 A11.postman_collection.json
└── A10 local.postman_environment.json
tests/
├── setup-env.ts                     # Entorno de prueba sin secretos reales (A11)
└── api.test.ts                      # Vitest + SuperTest (A11)
client/                              # Cliente React + Vite (A11)
evidencias/
├── ec3-a10.md                       # EC3 F2 A10
├── ec3-a11.md                       # EC3 F2 A11
├── ec3-a11-reflexion.md
├── capturas-a11/
└── capturas/
```
