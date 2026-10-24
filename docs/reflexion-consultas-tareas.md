# Reflexión — EC2 F3 A8 Consultas de tareas

**1. ¿Qué responsabilidad nueva cumple task.repository.ts?**
Concentra todo el acceso a Mongoose del módulo de tareas: `find`, `countDocuments`, `create`, `findByIdAndUpdate` y `findByIdAndDelete`. También construye el filtro, el orden, `skip` y `limit` a partir de un `TaskListQuery` ya validado, y traduce los errores de persistencia (`ValidationError` → 422, cualquier otro fallo → 503 `DATABASE_UNAVAILABLE`). Gracias a eso `task.service.ts` ya no importa `TaskModel`: solo aplica reglas (por ejemplo, decidir que `null` es `TASK_NOT_FOUND`) y arma `data` y `meta`.

**2. ¿Por qué el middleware debe validar req.query antes del controlador?**
Porque `req.query` viene del cliente y puede traer texto, arreglos u objetos (`page=1&page=2` llega como arreglo). `validateTaskQuery` lo trata como dato desconocido, rechaza parámetros que no están en la lista y deja en `res.locals.taskQuery` un objeto limpio con tipos correctos. Así el controlador no interpreta cadenas y una URL inválida responde 422 sin llegar a Atlas; en las pruebas, `owner=ana` respondió 422 `QUERY_VALIDATION_ERROR` sin consultar la base.

**3. ¿Cómo se calcula skip para una página determinada?**
`skip = (page - 1) × limit`. Con `page=2&limit=2` se saltan 2 documentos y se devuelven el tercero y el cuarto (en la prueba: Practicar búsqueda y Revisar API).

**4. ¿Por qué find y countDocuments deben usar el mismo filtro?**
Porque `meta.total` y `meta.totalPages` deben describir el mismo conjunto que se está paginando. Si `countDocuments` ignorara `status` o `search`, el cliente vería `total 11` aunque solo existan 2 tareas completadas. Con el mismo `filter`, `status=completed` dio `total 2` y `status=pending` dio `total 3`.

**5. ¿Qué problema evita escapeRegex?**
Evita que el texto de búsqueda se interprete como una expresión regular. Sin escapar, `search=.*` coincidiría con todo; con `escapeRegex` se busca el texto literal ".*" y la prueba devolvió `total 0`. También impide patrones costosos escritos a propósito.

**6. ¿Por qué sortBy utiliza una lista permitida?**
Para que el cliente no pueda ordenar por campos arbitrarios o internos. Solo se aceptan `createdAt`, `updatedAt`, `title` y `status`; `sortBy=priority` respondió 422. El valor que llega a Mongoose nunca es el texto crudo de la URL, sino un `TaskSortField` ya comprobado.

**7. ¿Qué diferencia existe entre data.length, meta.total y meta.totalPages?**
`data.length` es cuántas tareas vienen en esta página (como máximo `limit`); `meta.total` es cuántos documentos cumplen el filtro en toda la colección; `meta.totalPages = ceil(total / limit)`. Con el conjunto guiado y `limit=2`: `data.length` 2, `total` 5 y `totalPages` 3.

**8. ¿Cómo llega un error asíncrono del repositorio al errorHandler de Express 5?**
El repositorio envuelve cada operación con `execute`, que convierte el error en `AppError`. El servicio y el controlador usan `await`, así que la promesa rechazada sube hasta el controlador. Express 5 detecta que el controlador devolvió una promesa rechazada y llama `next(error)`; el `errorHandler` responde con `code`, `message`, `details` y `requestId`. No se necesita `try/catch` en el controlador.

**9. ¿Qué prueba demuestra que A8 no rompió el CRUD de A7?**
La regresión completa: POST 201, GET por id 200, PATCH 200, PATCH `/complete` 200, DELETE 204 sin cuerpo, GET del id eliminado 404 `TASK_NOT_FOUND`, id inválido 400 `INVALID_ID` y ruta inexistente 404. Además, después de reiniciar la API las cinco tareas guiadas siguieron respondiendo 200. La prioridad opcional del desafío de A7 también se conservó en el repositorio.

**10. ¿Qué limitación tiene la paginación basada en skip cuando la colección crece mucho?**
MongoDB tiene que recorrer y descartar todos los documentos saltados, así que `page=100000` es cada vez más lento. Además, si se insertan o borran documentos entre una página y otra, los resultados pueden moverse (repetirse u omitirse). Para colecciones grandes conviene paginación por cursor (por ejemplo, "dame los siguientes después de este `createdAt` y `_id`") apoyada en un índice.
