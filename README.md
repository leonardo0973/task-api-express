# Task API Express

API REST de gestión de tareas construida con **Express 5**, **TypeScript**, **PNPM** y **Mongoose 8**, conectada de forma segura con **MongoDB Atlas**. En esta versión (**EC2 F2 A7**) el módulo de tareas cubre el CRUD completo sobre MongoDB Atlas mediante `TaskModel` (identificadores `ObjectId` y `timestamps`), con una actualización parcial general `PATCH /api/tasks/:id` que modifica `title`, `status` y `priority` sin sobrescribir los campos que no se envían.

## Requisitos

- Node.js 20 o superior
- PNPM 9 o superior
- Cuenta de MongoDB Atlas con un clúster (el nivel gratuito M0 es suficiente)
- Postman para las pruebas

## Variables de entorno

Copia `.env.example` como `.env` y completa los valores. **`.env` nunca se sube a Git.**

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No (3000) | Puerto HTTP de la API. Entero entre 1 y 65535. |
| `MONGODB_URI` | Sí | Cadena `mongodb+srv://` del clúster de Atlas con el usuario exclusivo de la API. |
| `MONGODB_DB_NAME` | Sí | Base de datos de la API: `task_api`. |
| `JWT_SECRET` | Sí | Clave aleatoria de al menos 32 bytes para firmar los JWT (HS256). |
| `JWT_EXPIRES_IN` | No (`1h`) | Vigencia del token: número seguido de `s`, `m`, `h` o `d`. |
| `JWT_ISSUER` | No (`task-api-express`) | Emisor que se firma y se exige al verificar. |
| `JWT_AUDIENCE` | No (`task-api-client`) | Audiencia que se firma y se exige al verificar. |

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
| GET | `/health` | `200 { "status": "ok" }` — el proceso está activo. |
| GET | `/health/database` | `200` con `ping`, base de datos y latencia; `503 DATABASE_UNAVAILABLE` si MongoDB no responde. |

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
| POST | `/api/auth/register` | 201 | Recibe `name`, `email`, `password` (15 caracteres a 72 bytes) y `confirmPassword`. Devuelve `data.user` sin contraseña ni hash; el rol siempre es `user`. |
| POST | `/api/auth/login` | 200 | Recibe `email` y `password`. Devuelve `data.user`, `accessToken`, `tokenType: "Bearer"` y `expiresIn`. |

- Las contraseñas se guardan solo como hash bcrypt (12 rondas, `bcryptjs`); `passwordHash` tiene `select: false`.
- El JWT (`jose`, HS256) contiene únicamente `sub`, `role`, `iss`, `aud`, `iat` y `exp`.
- Errores: `409 USER_EMAIL_EXISTS`, `422 AUTH_VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (mismo mensaje para correo inexistente y contraseña incorrecta), `415`, `400 INVALID_JSON`.
- En A9 las rutas de tareas siguen públicas; la protección con token llega en A10.

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
- `JWT_SECRET` se genera con `randomBytes(32)` y solo existe en `.env`.
- Verificación: `git check-ignore .env` debe imprimir `.env` y `git ls-files .env` no debe imprimir nada.

## Estructura

```
src/
├── app.ts                      # Configuración de Express
├── server.ts                   # Valida entorno → conecta Atlas → abre puerto
├── config/env.ts               # Validación de variables de entorno
├── config/database.ts          # Conexión Mongoose a MongoDB Atlas
├── services/database.service.ts# Ping a Atlas para /health/database
├── services/task.service.ts    # Reglas de tareas y metadatos de paginación (A8)
├── services/auth.service.ts    # Registro y login (A9)
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
└── Task API EC3 F1 A9.postman_collection.json
```
