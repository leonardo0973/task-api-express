# Pruebas de consultas de tareas — EC2 F3 A8

## Entorno
- Rama: `feature/consultas-paginadas`
- Base: `task_api`
- Colección: `tasks`
- Node.js: v24.19.0 · PNPM: 11.24.0 · Mongoose 8.24 (sin cambio de versión mayor)
- Resultado de pnpm check: Exitoso (`tsc --noEmit`, código de salida 0)
- Resultado de pnpm build: Exitoso (`tsc`, código de salida 0). `dist/` contiene `repositories/task.repository.js`, `types/task-query.js` y `middlewares/validate-task-query.middleware.js`.
- `GET /health/database`: 200, `status ok`, `ping ok`, base `task_api`.

## Datos preparados
- Total de tareas en la colección al momento de la prueba: 11 (incluye tareas de actividades anteriores; no se borró información ajena).
- Conjunto guiado creado en esta prueba: 5 tareas (Aprender Express, Documentar MongoDB, Practicar búsqueda, Revisar API, Preparar entrega).
- Tareas pending: 3 · Tareas completed: 2 (Documentar MongoDB y Revisar API cambiadas con `PATCH /api/tasks/:id`).
- Para que los totales del conjunto guiado no se mezclen con tareas anteriores, las consultas guiadas se acotaron con `createdFrom=2026-10-24T03:22:54.144Z` y `createdTo=2026-10-24T03:22:57.399Z` (desafío individual). Las consultas sin ese rango también se registran con el total real de la colección.

## Casos ejecutados
| Tipo | Método y ruta | Esperado | Obtenido | requestId | Resultado |
|---|---|---|---|---|---|
| Regresión | GET /health | 200 | 200 | 67fd49f5-a122-48a1-b0ef-a23fbe8a6b8e | Aprobada — API activa |
| Regresión | GET /health/database | 200 | 200 | c19a3b0a-7546-4daa-aef6-316fb2a238c5 | Aprobada — status ok, ping ok, base task_api |
| Datos | POST /api/tasks "Aprender Express" | 201 | 201 | bc941ef7-fae3-4048-98fb-1584eba6e5a9 | Aprobada — id 6adc248fc65295f4c073683e |
| Datos | POST /api/tasks "Documentar MongoDB" | 201 | 201 | 469cbe67-5364-4126-975a-20e63ad12b9d | Aprobada — id 6adc248fc65295f4c0736840 |
| Datos | POST /api/tasks "Practicar búsqueda" | 201 | 201 | 783d77c1-b8d7-4bd2-bce7-d01c3c603f68 | Aprobada — id 6adc248fc65295f4c0736842 |
| Datos | POST /api/tasks "Revisar API" | 201 | 201 | 069fe077-1696-473e-97a5-bb394764275f | Aprobada — id 6adc248fc65295f4c0736844 |
| Datos | POST /api/tasks "Preparar entrega" | 201 | 201 | 7aafe46c-ab33-465f-a1a4-341af1e1fb62 | Aprobada — id 6adc2490c65295f4c0736846 |
| Datos | PATCH /api/tasks/:id "Documentar MongoDB" -> completed | 200 | 200 | a24f5750-2b2a-459b-a376-cc2f10e55b65 | Aprobada — status completed |
| Datos | PATCH /api/tasks/:id "Revisar API" -> completed | 200 | 200 | f6aad06f-6bd4-4fcb-bdb4-236354c43dbb | Aprobada — status completed |
| Positiva | GET /api/tasks | 200 | 200 | 391e9d79-17ab-48db-89a5-328b7271402f | Aprobada — meta.page 1, meta.limit 10, total colección 11, orden createdAt asc true, sin _id/__v true |
| Positiva | GET /api/tasks?page=1&limit=2 (conjunto guiado) | 200 | 200 | 69710e56-538f-41d1-b509-cf40916ecb20 | Aprobada — data 2, total 5, totalPages 3, hasNext true, hasPrev false |
| Positiva | GET /api/tasks?page=2&limit=2 (conjunto guiado) | 200 | 200 | b0dd633d-b7d5-4bad-a60b-f4b7f889dc1a | Aprobada — data Practicar búsqueda, Revisar API; repetidos false |
| Positiva | GET /api/tasks?page=1&limit=2 (colección completa) | 200 | 200 | b369d1e2-2b37-4eb8-b200-324f5fd8c174 | Aprobada — data 2, total 11, totalPages 6 |
| Positiva | GET /api/tasks?page=99&limit=2 (página posterior) | 200 | 200 | dcee4188-a5b4-4bb1-8ec0-973744e9af81 | Aprobada — data vacío true, hasNext false, hasPrev true |
| Positiva | GET /api/tasks?status=completed | 200 | 200 | f3dbb312-0430-4521-91c3-1bd4d6e59b10 | Aprobada — total 2 (conjunto guiado) |
| Positiva | GET /api/tasks?status=pending | 200 | 200 | 63c53b3b-ca8a-4dff-b185-559b4e42137f | Aprobada — total 3 (conjunto guiado) |
| Positiva | GET /api/tasks?search=api | 200 | 200 | ddef0bc4-d25b-46dc-a607-150a89246fe9 | Aprobada — títulos: Revisar API |
| Positiva | GET /api/tasks?search=MONGODB | 200 | 200 | 40cebcb5-517c-474e-b16e-f26565e57913 | Aprobada — sin distinguir mayúsculas: Documentar MongoDB |
| Positiva | GET /api/tasks?search=.* | 200 | 200 | 622fa19d-49df-4ddf-906b-485df169c021 | Aprobada — literal, total 0 |
| Positiva | GET /api/tasks?sortBy=title&order=asc | 200 | 200 | c9433c3a-7959-40ad-a101-d9dddbe554aa | Aprobada — Aprender Express, Documentar MongoDB, Practicar búsqueda, Preparar entrega, Revisar API |
| Positiva | GET /api/tasks?sortBy=title&order=desc | 200 | 200 | 13f7cd46-40f3-4649-b3f6-2f671adfd681 | Aprobada — Revisar API, Preparar entrega, Practicar búsqueda, Documentar MongoDB, Aprender Express |
| Positiva | GET /api/tasks?sortBy=updatedAt&order=desc | 200 | 200 | 1830a7af-e81c-40c1-be3b-bad1c0645cd1 | Aprobada — primeras: Revisar API, Documentar MongoDB |
| Positiva | GET /api/tasks?status=pending&search=entrega&page=1&limit=2&sortBy=title&order=asc | 200 | 200 | a7e89c59-14d4-4d81-9494-b6a297fd9972 | Aprobada — total 1, totalPages 1, títulos Preparar entrega |
| Positiva | Misma consulta sin search | 200 | 200 | 666d8eb9-189c-450c-92ab-260bfb87d92a | Aprobada — total 3, totalPages 2 |
| Desafío | GET /api/tasks?createdFrom=..&createdTo=..&status=completed | 200 | 200 | ec2ef36f-4bef-49aa-8db7-fde7661c88c2 | Aprobada — total 2 |
| Desafío | GET /api/tasks?createdFrom=2026-13-40 | 422 | 422 `QUERY_VALIDATION_ERROR` | 62ea4933-44d3-42f2-8639-511dda949fc0 | Aprobada — createdFrom |
| Desafío | GET /api/tasks?createdFrom=2026-12-01&createdTo=2026-01-01 | 422 | 422 `QUERY_VALIDATION_ERROR` | c63c3049-6ce3-4ba8-9970-4da9f4ab89b7 | Aprobada — No debe ser posterior a createdTo. |
| Negativa | GET /api/tasks?page=0 | 422 | 422 `QUERY_VALIDATION_ERROR` | ba6d375b-9dc3-450d-aadb-611d185b0d9b | Aprobada — details.field page |
| Negativa | GET /api/tasks?page=abc | 422 | 422 `QUERY_VALIDATION_ERROR` | 41e9520e-956e-45d3-9957-aec83649cd15 | Aprobada — details.field page |
| Negativa | GET /api/tasks?page=1&page=2 | 422 | 422 `QUERY_VALIDATION_ERROR` | b85d1011-9395-46b9-aacb-c51fcf3cb411 | Aprobada — details.field page |
| Negativa | GET /api/tasks?limit=0 | 422 | 422 `QUERY_VALIDATION_ERROR` | b01555af-34ab-4f11-8329-42bc901e8ca5 | Aprobada — details.field limit |
| Negativa | GET /api/tasks?limit=51 | 422 | 422 `QUERY_VALIDATION_ERROR` | 6077d6e9-c955-4a72-9c0c-a9f6328242d2 | Aprobada — details.field limit |
| Negativa | GET /api/tasks?status=archived | 422 | 422 `QUERY_VALIDATION_ERROR` | eecf55ad-5d35-4f0b-82dc-651950702aaf | Aprobada — details.field status |
| Negativa | GET /api/tasks?search= | 422 | 422 `QUERY_VALIDATION_ERROR` | 90e37e36-a3a1-49d3-b91a-a53c4329eba5 | Aprobada — details.field search |
| Negativa | GET /api/tasks?search=<61 caracteres> | 422 | 422 `QUERY_VALIDATION_ERROR` | 17523e45-695e-41e5-ab00-e5b09e322f4a | Aprobada — details.field search |
| Negativa | GET /api/tasks?sortBy=priority | 422 | 422 `QUERY_VALIDATION_ERROR` | 40dd2c54-0e64-4bfe-b403-dd059f578f79 | Aprobada — details.field sortBy |
| Negativa | GET /api/tasks?order=sideways | 422 | 422 `QUERY_VALIDATION_ERROR` | 5dd41842-d73f-48d3-bbd3-dfc5c9b19422 | Aprobada — details.field order |
| Negativa | GET /api/tasks?owner=ana | 422 | 422 `QUERY_VALIDATION_ERROR` | 65a1917e-d331-4c27-aaf0-ac267ee4dc25 | Aprobada — details.field owner |
| Regresión | POST /api/tasks | 201 | 201 | 8ee64709-ebf8-480c-a810-84607f36ac9c | Aprobada — id 6adc2491c65295f4c073686a |
| Regresión | GET /api/tasks/:id | 200 | 200 | 4db51ede-14a9-4e74-b9c4-f9bda76f8680 | Aprobada — Regresión A8 |
| Regresión | PATCH /api/tasks/:id | 200 | 200 | 582f1a8a-b1f1-4f78-96fb-6b84b45d8598 | Aprobada — Regresión A8 actualizada |
| Regresión | PATCH /api/tasks/:id/complete | 200 | 200 | c2c9594f-f9a2-4b84-8b9e-b9f73f3fc0e3 | Aprobada — status completed |
| Regresión | DELETE /api/tasks/:id | 204 | 204 | 70899917-9b5a-4fdd-bd55-0a4a00579869 | Aprobada — sin cuerpo |
| Regresión | GET /api/tasks/:id eliminado | 404 | 404 `TASK_NOT_FOUND` | 7e2c38b8-6dad-449c-a9f2-015248b0aa74 | Aprobada —  |
| Regresión | GET /api/tasks/123 | 400 | 400 `INVALID_ID` | 815bee58-76f6-45a6-b8a3-9793655ff0b8 | Aprobada —  |
| Regresión | GET /api/no-existe | 404 | 404 `ROUTE_NOT_FOUND` | 6f607cf3-7fc9-48ac-ac01-a9c02e12c3b0 | Aprobada —  |

Resumen: 46/46 casos aprobados. La colección `postman/Task API EC2 F3 A8.postman_collection.json` repite las pruebas en el Runner de Postman: 42 solicitudes, 78 tests aprobados, 0 fallidos.

## Persistencia después de reiniciar
La API se detuvo y se volvió a iniciar; cada tarea del conjunto guiado se consultó por id:

| Tarea | id | Código | status persistido |
|---|---|---|---|
| Aprender Express | `6adc248fc65295f4c073683e` | 200 | pending |
| Documentar MongoDB | `6adc248fc65295f4c0736840` | 200 | completed |
| Practicar búsqueda | `6adc248fc65295f4c0736842` | 200 | pending |
| Revisar API | `6adc248fc65295f4c0736844` | 200 | completed |
| Preparar entrega | `6adc2490c65295f4c0736846` | 200 | pending |

## Evidencias
1. Compilación correcta: `pnpm check` y `pnpm build` terminaron con código 0.
2. Dos páginas sin documentos repetidos: `page=1&limit=2` devolvió Aprender Express y Documentar MongoDB; `page=2&limit=2` devolvió Practicar búsqueda y Revisar API (`hasPreviousPage true`).
3. Filtro y búsqueda combinados: `status=pending&search=entrega&page=1&limit=2&sortBy=title&order=asc` → total 1 (Preparar entrega); sin `search` → total 3, totalPages 2.
4. Orden ascendente y descendente: `sortBy=title&order=asc` en orden alfabético y `order=desc` en orden inverso.
5. Error 422 con details y requestId: todos los casos negativos devolvieron `QUERY_VALIDATION_ERROR`, el campo en `details` y `requestId`.
6. CRUD heredado completo: POST 201, GET 200, PATCH 200, PATCH /complete 200, DELETE 204, GET eliminado 404 `TASK_NOT_FOUND`, id inválido 400 `INVALID_ID`, ruta inexistente 404.
7. Persistencia después de reiniciar: las 5 tareas respondieron 200 con su status.
- Capturas: `docs/capturas/a8-01-runner-positivas.jpg` y `docs/capturas/a8-02-runner-negativas.jpg` (sin URI, usuario, contraseña ni host).

## Desafío individual: createdFrom y createdTo
- Se aceptan fechas ISO 8601 (`2026-10-24` o `2026-10-24T03:22:54.144Z`); `createdFrom=2026-13-40` → 422 `QUERY_VALIDATION_ERROR` (field `createdFrom`).
- `createdFrom` posterior a `createdTo` → 422 con el mensaje "No debe ser posterior a createdTo.".
- El repositorio agrega `$gte` y `$lte` sobre `createdAt` al mismo `filter` que usan `find` y `countDocuments`, por eso `meta.total` cambia de forma coherente (positiva: rango + `status=completed` → total 2).
- Regresión: con el rango activo, la paginación, el orden y la búsqueda siguen funcionando; el CRUD no cambió.

## Caso no ejecutado
- 503 con Atlas detenido: no se detuvo el clúster compartido. El repositorio traduce cualquier fallo no previsto de Mongoose a `503 DATABASE_UNAVAILABLE` sin exponer la URI (`mapPersistenceError`), y este comportamiento ya se probó en A5 desconectando la red.
