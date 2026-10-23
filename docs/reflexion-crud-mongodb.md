# Reflexión — EC2 F2 A7 Implementación completa de operaciones CRUD persistentes con Express y MongoDB

**1. ¿Qué operación de Mongoose corresponde a cada letra de CRUD?**
* **C (Create):** `TaskModel.create({ ... })` — Crea e inserta un nuevo documento en la colección de MongoDB.
* **R (Read):** `TaskModel.find()` para consultar la lista completa y `TaskModel.findById(id)` para consultar un documento individual por su `_id`.
* **U (Update):** `TaskModel.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true })` — Modifica parcialmente campos específicos de un documento existente.
* **D (Delete):** `TaskModel.findByIdAndDelete(id)` — Elimina permanentemente el documento de la colección.

**2. ¿Por qué se usa PATCH y no un reemplazo completo del documento?**
Se utiliza `PATCH` porque representa semánticamente una modificación parcial de un recurso. Permite al cliente enviar únicamente los campos que desea modificar (por ejemplo, solo cambiar el título o solo el estado o la prioridad), sin la obligación de enviar la totalidad del recurso. Si se usara `PUT` (reemplazo completo) o `replaceOne`, los campos ausentes en el cuerpo de la solicitud se perderían o se sobreescribirían indebidamente con valores vacíos o predeterminados.

**3. ¿Qué problema evita `$set`?**
El operador `$set` de MongoDB actualiza exclusivamente los pares clave-valor especificados dentro del objeto de cambios sin tocar los demás atributos del documento existente. Esto evita sobrescribir campos preexistentes no incluidos en la solicitud, previene la pérdida de datos y asegura que atributos como `createdAt` o campos administrados internamente se conserven intactos.

**4. ¿Qué efecto tienen `new: true` y `runValidators: true`?**
* **`new: true`:** Por defecto, `findByIdAndUpdate` devuelve el documento en su estado previo a la actualización. Al pasar `new: true`, Mongoose retorna el documento ya modificado, lo que permite a la API responder inmediatamente al cliente con los datos actualizados y con la nueva marca de tiempo `updatedAt`.
* **`runValidators: true`:** Por defecto en Mongoose, las validaciones del esquema solo se ejecutan automáticamente en `save()` o `create()`, omitiéndose en las operaciones de actualización. Al activar `runValidators: true`, Mongoose fuerza la validación de las reglas del esquema (`maxlength`, `enum`, `required`) sobre los campos que se están actualizando.

**5. ¿Por qué un cuerpo vacío debe rechazarse?**
Enviar un cuerpo vacío `{}` en un `PATCH` carece de sentido semántico porque no declara ninguna intención de cambio. Si no se rechazara con `422 VALIDATION_ERROR`, la API realizaría una operación de actualización innecesaria en la base de datos que solo refrescaría artificialmente la marca de tiempo `updatedAt` sin alterar ningún dato real del recurso. Validar que al menos un campo permitido esté presente protege los recursos del servidor y la coherencia de la base de datos.

**6. ¿Qué diferencia existe entre `INVALID_ID` y `TASK_NOT_FOUND`?**
* **`INVALID_ID` (400 Bad Request):** Es una falla sintáctica en la entrada de la ruta. Ocurre a nivel de middleware (`validateTaskId`) cuando el valor recibido en el parámetro `:id` no coincide con la estructura de un `ObjectId` de 24 caracteres hexadecimales (por ejemplo, `/api/tasks/1` o `/api/tasks/abc`). La solicitud se rechaza antes de consultar la base de datos.
* **`TASK_NOT_FOUND` (404 Not Found):** Es una regla de negocio. Ocurre cuando el identificador sí tiene un formato válido de `ObjectId`, pero al consultar MongoDB Atlas la colección no contiene ningún documento con ese `_id`.

**7. ¿Qué responsabilidad cumple `validateTaskUpdate` y cuál cumple `TaskModel`?**
* **`validateTaskUpdate` (Capa HTTP / Middleware):** Valida la entrada HTTP que proviene del cliente. Trata `req.body` como `unknown`, verifica que sea un objeto JSON, rechaza cuerpos vacíos, bloquea campos no autorizados (como `_id`, `createdAt`, `owner`), y valida los tipos y límites de longitud antes de invocar el servicio.
* **`TaskModel` (Capa de Persistencia / Modelo):** Actúa como la segunda barrera y salvaguarda final de la base de datos. Garantiza que cualquier operación que intente persistir datos cumpla estrictamente con el esquema (`enum`, longitudes máximas, tipos y valores por defecto), independientemente de qué parte del código invoque el modelo.

**8. ¿Cómo llega un error de `updateTask` al `errorHandler` de Express 5?**
En Express 5, los controladores asíncronos (`async/await`) que arrojan una excepción (`throw new AppError(...)`) o cuyas promesas son rechazadas son interceptados automáticamente por el framework. Express 5 detecta la promesa rechazada y redirige de inmediato el flujo de ejecución al último middleware registrado en `app.ts` (`error.middleware.ts`), sin necesidad de envolver cada controlador en bloques `try/catch` manuales ni de invocar `next(error)`.

**9. ¿Por qué DELETE responde 204 sin cuerpo?**
El código de estado HTTP `204 No Content` indica que la acción de eliminación se ejecutó con éxito y que el servidor no tiene ningún contenido adicional que entregar en el cuerpo de la respuesta. Devolver un cuerpo JSON en un 204 viola la especificación del protocolo HTTP. Por ello, se invoca `res.status(204).send()`.

**10. ¿Qué prueba demuestra que el CRUD es persistente y no solo funcional en memoria?**
La prueba definitiva consiste en ejecutar el ciclo completo (crear una tarea con `POST`, modificarla con `PATCH`), detener por completo el servidor Node.js (cerrando el proceso con `Ctrl+C`), volver a iniciar la aplicación (`pnpm dev` o `pnpm start`) y ejecutar `GET /api/tasks/:id`. Si la tarea recuperada refleja exactamente los cambios realizados antes del reinicio, se demuestra que la persistencia reside en MongoDB Atlas y no en variables volátiles de la memoria RAM del servidor.
