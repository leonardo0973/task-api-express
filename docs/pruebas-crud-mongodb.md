# Pruebas del CRUD persistente — EC2 F2 A7

## Entorno
- Rama: `feature/crud-persistente-completo`
- Base: `task_api`
- Colección: `tasks`
- Resultado de pnpm check: Exitoso (`tsc --noEmit` sin errores)
- Resultado de pnpm build: Exitoso (`tsc` emitió los archivos en `dist/`)

## Recurso de prueba
- id devuelto por POST: `6adaa1f434342c660ae29ccf`
- title inicial: `"Preparar evidencia del CRUD"`
- title final: `"Revisar evidencias"`
- status final: `"completed"`
- Persistencia después de reiniciar: La tarea modificada (`6adaa1f534342c660ae29cdc` con prioridad `low`) permaneció en MongoDB Atlas tras detener y reiniciar el servidor Node.js, respondiendo `200 OK` con todos sus datos íntegros.

## Casos ejecutados

| Tipo | Método y ruta | Datos | Esperado | Obtenido | requestId | Resultado |
|---|---|---|---|---|---|---|
| Positiva | POST /api/tasks | `{"title":"Preparar evidencia del CRUD"}` | 201 | 201 Creado (id `6adaa1f434342c660ae29ccf`, status `pending`, priority `medium`) | f6213015-d7b0-44d3-a87c-20adeb486c24 | Aprobada |
| Positiva | GET /api/tasks | Sin cuerpo | 200 | 200 Lista de tareas de Atlas | ff0330e2-c9fb-4b40-b398-27a0e417f76d | Aprobada |
| Positiva | GET /api/tasks/:id | Sin cuerpo | 200 | 200 Tarea localizada por ObjectId | 2997c498-1cdc-4aac-a578-0e3f6f471d17 | Aprobada |
| Positiva | PATCH /api/tasks/:id | `{"title":"Documentar el CRUD persistente"}` | 200 | 200 Título actualizado, status `pending` conservado | 9d493d84-7e2b-4dc4-997d-7c07b833c1d8 | Aprobada |
| Positiva | PATCH /api/tasks/:id | `{"status":"completed"}` | 200 | 200 Status `completed`, título conservado | 938bc233-fbd6-4f47-a96a-f70c32555583 | Aprobada |
| Positiva | PATCH /api/tasks/:id | `{"title":"Revisar evidencias","status":"pending"}` | 200 | 200 Ambos campos actualizados, `updatedAt` nuevo | c4db000d-ce06-4f55-862b-30a08acf7995 | Aprobada |
| Regresión | PATCH /api/tasks/:id/complete | Sin cuerpo | 200 | 200 Completada delegando en updateTask | 67061f8c-508d-438c-a268-f6ba7055d01e | Aprobada |
| Positiva | DELETE /api/tasks/:id | Sin cuerpo | 204 | 204 sin cuerpo | bc74857a-da3a-4700-b742-1a8ae6e90a99 | Aprobada |
| Regresión | GET /api/tasks/:id | Sin cuerpo tras DELETE | 404 | 404 `TASK_NOT_FOUND` | d8dcf19b-cac5-4d50-a446-fc220a0bb1ea | Aprobada |
| Negativa | GET /api/tasks/1 | Sin cuerpo | 400 | 400 `INVALID_ID` ("El id debe ser un ObjectId válido.") | 63a6dfdd-d389-46fa-b3a2-1ae989d2ece9 | Aprobada |
| Negativa | PATCH /api/tasks/:id | `{}` (cuerpo vacío) | 422 | 422 `VALIDATION_ERROR` ("Incluye al menos title o status.") | 3d78d611-5d9b-403e-ae64-0f088514f045 | Aprobada |
| Negativa | PATCH /api/tasks/:id | `{"status":"archived"}` | 422 | 422 `VALIDATION_ERROR` ("Debe ser pending o completed.") | 95aac3aa-0bc6-44fb-9215-808268bc3bc1 | Aprobada |
| Negativa | PATCH /api/tasks/:id | `{"owner":"Ana"}` | 422 | 422 `VALIDATION_ERROR` ("El campo no está permitido.") | 7942c0ff-cfa3-48d9-95ba-453d6611c829 | Aprobada |
| Negativa | PATCH /api/tasks/:id | JSON mal formado (`{"title":`) | 400 | 400 `INVALID_JSON` | 78441b47-9aa3-49d5-8bc5-0c8a033d4b88 | Aprobada |
| Negativa | PATCH /api/tasks/:id | Sin `application/json` (texto plano) | 415 | 415 `UNSUPPORTED_MEDIA_TYPE` | 1f6b89e3-7d0c-42be-b419-fa081a1a4c9a | Aprobada |
| Negativa | DELETE /api/tasks/507f1f77bcf86cd799439011 | Sin cuerpo (inexistente) | 404 | 404 `TASK_NOT_FOUND` | fa2c78a9-00a7-4085-bcbd-602af1979241 | Aprobada |
| Negativa | GET /api/tasks | Atlas no disponible | 503 | 503 `DATABASE_UNAVAILABLE` sin filtrar host ni credenciales | No aplica | Aprobada |
| Desafío | POST /api/tasks | `{"title":"Tarea prioridad default"}` | 201 | 201 Creado con `priority: "medium"` automático | 9f0892d7-8eb0-4b37-8674-80211975962b | Aprobada |
| Desafío | POST /api/tasks | `{"title":"Tarea prioridad alta","priority":"high"}` | 201 | 201 Creado con `priority: "high"` | f9af3329-55d0-4650-899b-2a49cf4a658d | Aprobada |
| Desafío | PATCH /api/tasks/:id | `{"priority":"low"}` | 200 | 200 Actualizado con `priority: "low"` | 2a2be733-e9da-47fc-ac6e-7f3a00e27721 | Aprobada |
| Desafío | PATCH /api/tasks/:id | `{"priority":"urgent"}` | 422 | 422 `VALIDATION_ERROR` ("Debe ser low, medium o high.") | b0f15d03-8d6a-4f64-a24b-3d74307cb6c6 | Aprobada |

## Evidencias
1. **Compilación correcta:** `pnpm check` y `pnpm build` ejecutaron con cero errores.
2. **Documento antes y después de PATCH en Atlas:** Se observó la transición del documento en Atlas Data Explorer (título modificado, estado completado y actualización de `updatedAt` sin alterar `createdAt` ni `_id`).
3. **Respuesta 204 sin cuerpo:** La operación `DELETE` devolvió código `204 No Content` con cuerpo vacío mediante `res.status(204).send()`.
4. **Error de validación con requestId:** Todas las respuestas de error `400`, `404`, `415` y `422` mantienen el contrato uniforme con `error.code`, `error.message`, `error.details` y `requestId`.
5. **Consulta después de reiniciar:** Se probó que al reiniciar el servidor, la tarea con `priority: "low"` permanece almacenada en Atlas.

## Desafío individual: campo `priority`

| Archivo | Cambio | Motivo |
|---|---|---|
| `src/models/task.ts` | `TASK_PRIORITIES`, tipo `TaskPriority`, campo `priority` en `TaskPersistence`, `Task` y `TaskUpdate`; en el esquema `enum` y `default: 'medium'`. | Guardar el campo en Atlas y validarlo también en Mongoose (segunda barrera con `runValidators`). |
| `src/middlewares/validate-task-title.middleware.ts` | Acepta `priority` opcional en POST y lo valida contra el enum. | Rechazar valores desconocidos con 422 antes del servicio. |
| `src/middlewares/validate-task-update.middleware.ts` | Agrega `priority` a los campos permitidos y lo valida. | Permitir modificarlo con `PATCH /api/tasks/:id` sin ruta nueva. |
| `src/services/task.service.ts` | `createTask` recibe `priority` opcional; `toTask` lo incluye en la respuesta. | Persistir el valor y exponerlo en la respuesta pública. |
| `src/controllers/task.controller.ts` | `postTask` envía `res.locals.taskPriority` al servicio. | Mantener el flujo ruta → middleware → controlador → servicio. |

Las tareas creadas antes del desafío no tenían `priority`; Mongoose aplica el valor
predeterminado `medium` al leerlas, por lo que no se rompe la respuesta de las tareas existentes.
