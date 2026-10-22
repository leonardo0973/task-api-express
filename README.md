# Task API Express

API REST de gestión de tareas construida con **Express 5**, **TypeScript** y **PNPM**.
A partir de EC2 F1 A5 la API se conecta de forma segura con **MongoDB Atlas** mediante
**Mongoose 8**. El CRUD de tareas continúa usando el arreglo en memoria; la persistencia
de tareas se incorporará en las siguientes actividades.

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
detiene con un mensaje que nombra la variable, sin mostrar su valor.

## Configuración de MongoDB Atlas

1. Crea un proyecto y un despliegue gratuito (M0).
2. **Database Access** → *Add New Database User*:
   - Autenticación por contraseña (usa *Autogenerate Secure Password*).
   - *Specific Privileges* → rol `readWrite` sobre la base de datos `task_api` únicamente.
3. **Network Access** → autoriza solo la IP pública de tu equipo (*Add Current IP Address*).
   No uses `0.0.0.0/0`.
4. **Connect → Drivers** → copia la cadena de conexión y colócala en `MONGODB_URI` dentro
   de `.env`, sustituyendo usuario y contraseña.

## Instalación

```bash
pnpm install
```

## Ejecución

```bash
pnpm check   # Comprobación de tipos
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

### Tareas (arreglo en memoria)

| Método | Ruta | Éxito |
|---|---|---|
| GET | `/api/tasks` | 200 |
| GET | `/api/tasks/:id` | 200 |
| POST | `/api/tasks` | 201 |
| PATCH | `/api/tasks/:id` | 200 (editar título) |
| PATCH | `/api/tasks/:id/complete` | 200 |
| PATCH | `/api/tasks/:id/status` | 200 (`{ "completed": true \| false }`) |
| DELETE | `/api/tasks/:id` | 204 |

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

| Estado | Código |
|---|---|
| 400 | `INVALID_ID`, `INVALID_JSON` |
| 404 | `TASK_NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `VALIDATION_ERROR` |
| 500 | `INTERNAL_ERROR` |
| 503 | `DATABASE_UNAVAILABLE`, `SERVICE_UNAVAILABLE` (durante el cierre) |

Cada respuesta incluye el encabezado `X-Request-Id`, que coincide con `error.requestId`.

## Cierre ordenado

Al recibir `SIGINT` (Ctrl+C) o `SIGTERM` la API:

1. deja de aceptar solicitudes nuevas (las que llegan reciben `503 SERVICE_UNAVAILABLE`);
2. espera a que terminen las solicitudes en curso y cierra el servidor HTTP;
3. cierra MongoDB con `mongoose.disconnect()`;
4. termina con código 0. Si tarda más de 10 s, fuerza la salida con código 1.

```
[shutdown] SIGINT recibido. Dejando de aceptar solicitudes...
[shutdown] Servidor HTTP cerrado.
[shutdown] Conexión con MongoDB cerrada.
[shutdown] Proceso finalizado correctamente.
```

> En Windows, demuestra el cierre con `pnpm build` y `pnpm start`, y después Ctrl+C.

## Medidas de seguridad

- Las credenciales viven solo en `.env`, excluido por `.gitignore`. `.env.example` no tiene valores reales.
- Usuario de Atlas exclusivo con `readWrite` limitado a `task_api`; no se usa un usuario administrador.
- Acceso de red restringido a la IP del equipo de desarrollo (sin `0.0.0.0/0`).
- La terminal y las respuestas nunca muestran la URI, la contraseña, el host, el stack ni objetos internos de Mongoose.
- Los errores del driver se traducen a `503 DATABASE_UNAVAILABLE`.
- Verificación: `git check-ignore .env` debe imprimir `.env` y `git ls-files .env` no debe imprimir nada.

## Estructura

```
src/
├── app.ts                      # Configuración de Express (sin abrir el puerto)
├── server.ts                   # Valida entorno → conecta Atlas → abre puerto
├── config/env.ts               # Lectura y validación de variables
├── config/database.ts          # Conexión y desconexión con Mongoose
├── services/database.service.ts# Ping a MongoDB para /health/database
├── controllers/                # health y task
├── routes/                     # health.routes y task.routes
├── middlewares/                # requestId, JSON, validaciones, errores, cierre
├── errors/                     # AppError y traducción segura de errores de MongoDB
├── lifecycle/graceful-shutdown.ts
├── data/ models/ services/task.service.ts  # CRUD en memoria (EC1)
└── types/api-error.ts
docs/
├── pruebas-conexion-mongodb.md
└── reflexion-mongodb.md
postman/Task API EC2 F1 A5.postman_collection.json
```
