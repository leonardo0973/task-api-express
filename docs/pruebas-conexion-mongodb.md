# Pruebas de conexión con MongoDB Atlas — EC2 F1 A5

Colección de Postman: **Task API EC2 F1 A5** (`postman/Task API EC2 F1 A5.postman_collection.json`).
Variable de colección `baseUrl = http://localhost:3000`.

Cómo llenar la tabla: ejecuta cada solicitud con `pnpm dev` activo, anota el código obtenido,
copia el encabezado `X-Request-Id` (coincide con `error.requestId` en los errores) y marca
**Aprobada** o **Fallida**. Las capturas van en `docs/capturas/` y no deben mostrar la URI,
el usuario ni la contraseña.

## 1. Infraestructura

| # | Tipo | Método y ruta | Datos o condición | Resultado esperado | Resultado obtenido | requestId | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Infraestructura | GET /health | Sin cuerpo | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | e2aa4070-71c0-4d18-b2bc-04b2ac05bc67 | Aprobada |
| 2 | Infraestructura | GET /health/database | Atlas conectado | 200 `ping: ok`, `database: task_api` | 200 `ping: ok`, `database: task_api`, `latencyMs: 51` | dfafb174-95bb-4c27-96cb-aebfae7680c9 | Aprobada |
| 3 | Infraestructura | GET /health/database | Desactiva la red (Wi-Fi) con la API en marcha | 503 `DATABASE_UNAVAILABLE` sin host ni URI | 503 `DATABASE_UNAVAILABLE` ("La base de datos no está disponible en este momento.") | b79f32cb-5079-450b-93f5-cf8b0ea6f19a | Aprobada |
| 4 | Infraestructura | Arranque `pnpm dev` | Contraseña de `MONGODB_URI` temporalmente incorrecta | La API no abre el puerto; terminal: "MongoDB Atlas rechazó la autenticación…"; sin URI ni contraseña | Proceso termina con código 1. Terminal: "[mongodb] MongoDB Atlas rechazó la autenticación..."; puerto no abierto | No aplica | Aprobada |
| 5 | Infraestructura | Arranque `pnpm dev` | `MONGODB_URI` eliminada de `.env` | Mensaje "MONGODB_URI es obligatoria", salida con código 1 | Terminal: "[config] No se puede iniciar la API: - MONGODB_URI es obligatoria. Defínela en el archivo .env."; código 1 | No aplica | Aprobada |
| 6 | Infraestructura | Ctrl+C en `pnpm start` | SIGINT con la API conectada | Mensajes `[shutdown]`, MongoDB cerrado, fin sin errores | Terminal: "[shutdown] SIGINT recibido... Servidor HTTP cerrado... Conexión con MongoDB cerrada... Proceso finalizado correctamente."; código 0 | No aplica | Aprobada |

## 2. Casos positivos de tareas

| # | Tipo | Método y ruta | Datos | Resultado esperado | Resultado obtenido | requestId | Estado |
|---|---|---|---|---|---|---|---|
| 7 | Positivo | GET /api/tasks | Sin cuerpo | 200 con la lista inicial | 200 con 2 tareas iniciales en `data` | f14ec25a-ce44-47ab-b267-1abdc15de5db | Aprobada |
| 8 | Positivo | POST /api/tasks | `{"title":"Aprender MongoDB Atlas"}` | 201 con la tarea creada (id 3) | 201 con tarea id 3 ("Aprender MongoDB Atlas") | e914ee37-224d-4e99-9bae-2637cabbbfde | Aprobada |
| 9 | Positivo | GET /api/tasks/3 | Sin cuerpo | 200 con la tarea 3 | 200 con tarea id 3 | d892c940-c19a-4ddc-b358-e40ccb9c2ecc | Aprobada |
| 10 | Positivo | PATCH /api/tasks/3 | `{"title":"Configurar Atlas"}` | 200 con el título actualizado | 200 con título "Configurar Atlas" | 274e72e2-cf5b-4421-bb4a-477156b92bd6 | Aprobada |
| 11 | Positivo | PATCH /api/tasks/3/complete | Sin cuerpo | 200 `status: completed` | 200 con `status: completed` | 5e5765e5-575d-4b0e-ae72-39c58fe276ab | Aprobada |
| 12 | Positivo | PATCH /api/tasks/3/status | `{"completed":false}` | 200 `status: pending` | 200 con `status: pending` | 630025cb-a4e2-4c13-aaf8-e5f3ea07db9d | Aprobada |
| 13 | Positivo | DELETE /api/tasks/3 | Sin cuerpo | 204 sin cuerpo | 204 sin cuerpo | bd6e5524-5a43-4ba4-b969-fb255b026dca | Aprobada |

## 3. Casos negativos de tareas

| # | Tipo | Método y ruta | Datos | Resultado esperado | Resultado obtenido | requestId | Estado |
|---|---|---|---|---|---|---|---|
| 14 | Negativo | GET /api/tasks/abc | Sin cuerpo | 400 `INVALID_ID` | 400 `INVALID_ID` ("El id debe ser un entero positivo.") | eeaa74bc-ce99-4742-8043-9f97f8a63338 | Aprobada |
| 15 | Negativo | GET /api/tasks/999 | Sin cuerpo | 404 `TASK_NOT_FOUND` | 404 `TASK_NOT_FOUND` ("No existe una tarea con el id 999.") | 94d0ea1c-b422-4b9d-9fc9-e0ae0fb34214 | Aprobada |
| 16 | Negativo | POST /api/tasks | Cuerpo en texto plano | 415 `UNSUPPORTED_MEDIA_TYPE` | 415 `UNSUPPORTED_MEDIA_TYPE` | 219cb720-287d-487a-b66c-61ffa90b0de3 | Aprobada |
| 17 | Negativo | POST /api/tasks | `{"title":""}` | 422 `VALIDATION_ERROR` | 422 `VALIDATION_ERROR` ("Debe ser texto no vacío.") | 894ffa41-89b0-43fc-963b-b5eed493b417 | Aprobada |
| 18 | Negativo | POST /api/tasks | `{"title":25}` | 422 `VALIDATION_ERROR` | 422 `VALIDATION_ERROR` ("Debe ser texto no vacío.") | 453c5f5a-4783-4043-b8cf-fc35d58a16c2 | Aprobada |
| 19 | Negativo | POST /api/tasks | `{"title":` (JSON malformado) | 400 `INVALID_JSON` | 400 `INVALID_JSON` ("El cuerpo contiene JSON inválido.") | 1bec454b-b63f-4ff1-94e1-71ae014f7115 | Aprobada |
| 20 | Negativo | PATCH /api/tasks/1/status | `{"completed":"si"}` | 422 `VALIDATION_ERROR` | 422 `VALIDATION_ERROR` ("Debe ser true o false.") | 398b8a95-7135-4d3c-8688-986ff2b907ad | Aprobada |
| 21 | Negativo | GET /ruta-inexistente | Sin cuerpo | 404 `ROUTE_NOT_FOUND` | 404 `ROUTE_NOT_FOUND` ("No existe GET /ruta-inexistente.") | 950182e2-c1ab-4e37-93e6-5e0b3dc71393 | Aprobada |

## 4. Regresión

| # | Tipo | Método y ruta | Datos | Resultado esperado | Resultado obtenido | requestId | Estado |
|---|---|---|---|---|---|---|---|
| 22 | Regresión | GET /api/tasks/3 | Después de DELETE | 404 `TASK_NOT_FOUND` | 404 `TASK_NOT_FOUND` ("No existe una tarea con el id 3.") | f1d8c740-774d-42d7-9349-fac46483fe1a | Aprobada |
| 23 | Regresión | Colección completa (Runner) | Ejecutar todas las solicitudes en orden | Todas las pruebas de Postman aprobadas | 23/23 pruebas aprobadas sin fallos de contrato | No aplica | Aprobada |

## Comprobación de credenciales

| Comando | Resultado esperado | Resultado obtenido |
|---|---|---|
| `git check-ignore .env` | Imprime `.env` | `.env` |
| `git ls-files .env` | No imprime nada | (vacío) |
| `git ls-files node_modules dist` | No imprime nada | (vacío) |

## Capturas

Guarda en `docs/capturas/` (sin credenciales):

- `01-health.png`, `02-health-database-200.png`, `03-health-database-503.png`
- `04-arranque-correcto.png`, `05-contrasena-incorrecta.png`
- `06-cierre-ordenado.png`, `07-runner-coleccion.png`
- `08-atlas-database-access.png` (usuario con `readWrite@task_api`)
- `09-atlas-network-access.png` (solo tu IP)
