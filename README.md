# Task API Express

API REST de gestión de tareas construida con **Express 5**, **TypeScript**, **PNPM** y **Mongoose 8**, conectada de forma segura con **MongoDB Atlas**. En esta versión (**EC2 F2 A6**), el almacenamiento de tareas se migró por completo a MongoDB Atlas mediante el modelo persistente `TaskModel` con identificadores `ObjectId`, marcas de tiempo automáticas (`timestamps`) y el campo opcional `description`.

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
| GET | `/api/tasks` | 200 | Lista todas las tareas ordenadas por fecha de creación. |
| GET | `/api/tasks/:id` | 200 | Consulta una tarea por su ObjectId (24 caracteres hex). |
| POST | `/api/tasks` | 201 | Crea una nueva tarea (`title` obligatorio, `description` opcional). |
| PATCH | `/api/tasks/:id/complete` | 200 | Marca la tarea como `completed` y actualiza `updatedAt`. |
| DELETE | `/api/tasks/:id` | 204 | Elimina el documento de la colección `tasks`. |

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
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Solicitud POST sin `Content-Type: application/json`. |
| 422 | `VALIDATION_ERROR`, `PERSISTENCE_VALIDATION_ERROR` | Longitud inválida en título o descripción. |
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
- Verificación: `git check-ignore .env` debe imprimir `.env` y `git ls-files .env` no debe imprimir nada.

## Estructura

```
src/
├── app.ts                      # Configuración de Express
├── server.ts                   # Valida entorno → conecta Atlas → abre puerto
├── config/env.ts               # Validación de variables de entorno
├── config/database.ts          # Conexión Mongoose a MongoDB Atlas
├── services/database.service.ts# Ping a Atlas para /health/database
├── services/task.service.ts    # Operaciones asíncronas con TaskModel
├── models/task.ts              # Esquema Mongoose, modelo y tipos (con description)
├── controllers/                # health y task (funciones asíncronas)
├── routes/                     # health.routes y task.routes
├── middlewares/                # requestId, JSON, validaciones de id y title, errores
├── errors/                     # AppError y describeDatabaseError
└── lifecycle/graceful-shutdown.ts
docs/
├── pruebas-persistencia-mongodb.md
└── reflexion-modelado-mongodb.md
postman/Task API EC2 F2 A6.postman_collection.json
```
