# Pruebas de modelado y persistencia — EC2 F2 A6

## Entorno
- Rama: `feature/modelo-tareas-mongodb`
- Base: `task_api`
- Colección: `tasks`
- Resultado de pnpm check: Exitoso (`tsc --noEmit` completado sin errores de tipos)
- Resultado de pnpm build: Exitoso (`tsc` completado, archivos JavaScript y declaraciones emitidos en `dist/`)

## Documento comprobado
- id devuelto por la API: `6ada9cf0449552acd76730c0`
- Campos observados en Atlas:
  - `_id`: `ObjectId("6ada9cf0449552acd76730c0")`
  - `title`: `"Tarea con descripción"`
  - `description`: `"Esta es una descripción válida para el desafío individual."`
  - `status`: `"pending"`
  - `createdAt`: `ISODate("2026-10-22T23:32:00.461Z")`
  - `updatedAt`: `ISODate("2026-10-22T23:32:00.461Z")`
- Resultado después de reiniciar: El documento permanece íntegro e inalterado en MongoDB Atlas; al consultar `GET /api/tasks/6ada9cf0449552acd76730c0` tras reiniciar el proceso de Node.js, la API responde `200 OK` con todos sus campos idénticos.

## Casos ejecutados

| Tipo | Método y ruta | Datos | Esperado | Obtenido | requestId | Resultado |
|---|---|---|---|---|---|---|
| Positiva | GET /health | Sin cuerpo | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | 18144245-c053-44f9-a70f-4f1256091b52 | Aprobada |
| Positiva | GET /health/database | Sin cuerpo | 200 `ping: ok`, `database: task_api` | 200 `ping: ok`, `latencyMs: 296` | b2df2627-5cbc-450f-ab27-0f638878cd47 | Aprobada |
| Persistencia | POST /api/tasks | `{"title":"Diseñar el modelo de tareas"}` | 201 con `id` de 24 caracteres | 201 `id: 6ada9cef449552acd76730bc` | 12172c88-e96e-442b-973f-38559909d00a | Aprobada |
| Persistencia | GET /api/tasks | Sin cuerpo | 200 lista desde Atlas | 200 lista con documentos de Atlas | ab37578f-f62d-4861-98d0-c623cca3dd5d | Aprobada |
| Persistencia | GET /api/tasks/6ada9cef449552acd76730bc | Sin cuerpo | 200 tarea localizada | 200 tarea localizada por ObjectId | c3921b61-af2b-4487-adce-e34264db584f | Aprobada |
| Desafío | POST /api/tasks | `{"title":"Tarea con descripción","description":"  Esta es una descripción válida para el desafío individual.  "}` | 201 con `description` recortada | 201 `description` recortada guardada | 3d3d1673-7a00-44dc-9935-45f921f18f37 | Aprobada |
| Desafío | POST /api/tasks | `{"title":"Tarea sin descripción válida"}` | 201 sin campo `description` | 201 tarea válida sin description | 137635bc-c959-4311-b4c4-518e47a78b48 | Aprobada |
| Desafío | POST /api/tasks | `{"title":"Tarea con descripción excedida","description":"...301 caracteres..."}` | 422 `VALIDATION_ERROR` en `description` | 422 `VALIDATION_ERROR` (No debe superar 300 caracteres) | 43449eb6-2b2c-4928-a7c5-2c762fab338a | Aprobada |
| Regresión | PATCH /api/tasks/6ada9cef449552acd76730bc/complete | Sin cuerpo | 200 `status: completed` | 200 `status: completed`, `updatedAt` actualizado | edafb119-4eeb-48c3-9aea-f4deeb095ce0 | Aprobada |
| Regresión | DELETE /api/tasks/6ada9cef449552acd76730bc | Sin cuerpo | 204 sin cuerpo | 204 sin cuerpo | 51fa128c-602b-4a19-9cab-df73a6041126 | Aprobada |
| Regresión | GET /api/tasks/6ada9cef449552acd76730bc | Sin cuerpo tras DELETE | 404 `TASK_NOT_FOUND` | 404 `TASK_NOT_FOUND` | 5e731f20-fe08-4abd-838b-e93171b1ffcc | Aprobada |
| Persistencia | Reinicio + GET /api/tasks | Sin cuerpo tras reiniciar Node.js | 200 las tareas previas persisten | 200 2 tareas recuperadas de Atlas | No aplica | Aprobada |
| Persistencia | Reinicio + GET /api/tasks/6ada9cf0449552acd76730c0 | Sin cuerpo tras reiniciar Node.js | 200 tarea persiste con descripción | 200 tarea encontrada intacta | No aplica | Aprobada |
| Negativa | GET /api/tasks/1 | Sin cuerpo | 400 `INVALID_ID` | 400 `INVALID_ID` ("El id debe ser un ObjectId válido.") | b7898213-298d-48f8-874f-30622f6188bf | Aprobada |
| Negativa | GET /api/tasks/507f1f77bcf86cd799439011 | Sin cuerpo (ObjectId inexistente) | 404 `TASK_NOT_FOUND` | 404 `TASK_NOT_FOUND` | 37e883ea-6095-4c16-bae3-8108f63b5d13 | Aprobada |
| Negativa | POST /api/tasks | `{"title":""}` | 422 `VALIDATION_ERROR` | 422 `VALIDATION_ERROR` ("Debe ser texto no vacío.") | e27eca91-c8b1-4d99-bee1-4c61bd8a7c0e | Aprobada |
| Negativa | POST /api/tasks | `{"title":"...121 caracteres..."}` | 422 `VALIDATION_ERROR` | 422 `VALIDATION_ERROR` ("No debe superar 120 caracteres.") | d0aa48dd-3b0d-44c3-9429-cb1808ad3e24 | Aprobada |
| Negativa | POST /api/tasks | Cuerpo en texto plano | 415 `UNSUPPORTED_MEDIA_TYPE` | 415 `UNSUPPORTED_MEDIA_TYPE` | 38945df0-cf22-4752-957d-c2249ec7fc00 | Aprobada |
| Infraestructura | Arranque con contraseña incorrecta | Credencial inválida en `.env` | Proceso sale con código 1 sin abrir puerto | Proceso finaliza con código 1; mensaje seguro sin credenciales | No aplica | Aprobada |

## Evidencias
1. **Compilación correcta:** `pnpm check` y `pnpm build` ejecutan sin errores con TypeScript estricto.
2. **POST y documento visible en Atlas sin credenciales:** El endpoint `POST /api/tasks` insertó documentos reales en la colección `tasks` de la base `task_api` en el clúster `cluster0.oqmag1v.mongodb.net`.
3. **Consulta después de reiniciar:** Se detuvo el servidor Node.js y se reinició. Al ejecutar `GET /api/tasks` y `GET /api/tasks/:id`, los documentos guardados continuaron existiendo de forma persistente.
4. **Distinción de capas de error:**
   - Error HTTP (formato inválido de entrada): `400 INVALID_ID` ante identificadores no conformes a ObjectId de 24 hex.
   - Regla de negocio: `404 TASK_NOT_FOUND` cuando el ObjectId tiene formato válido pero no existe en la base.
   - Falla de infraestructura: La API traduce fallos de conexión a `503 DATABASE_UNAVAILABLE` o rechaza el arranque sin revelar host, URI ni credenciales.
5. **Desafío individual:** Campo `description` opcional soportado con recorte de espacios (`trim`), límite de 300 caracteres, validación HTTP y persistencia en MongoDB Atlas.
