# Reflexión — EC2 F2 A6 Modelado de documentos y persistencia de tareas en MongoDB Atlas

**1. ¿Qué diferencia existe entre un documento, un esquema y un modelo?**
* **Documento:** Es el registro concreto de datos almacenado en formato BSON dentro de una colección de MongoDB (contiene `_id`, campos y marcas de tiempo).
* **Esquema (`Schema`):** Es la definición de la estructura, reglas de validación, tipos de datos, valores predeterminados y restricciones lógicas que Mongoose aplica sobre los documentos a nivel de aplicación.
* **Modelo (`Model`):** Es la clase constructora compilada a partir del esquema. Proporciona la interfaz de programación (métodos como `find()`, `create()`, `findByIdAndUpdate()`, `findByIdAndDelete()`) para realizar consultas y operaciones CRUD directamente sobre la colección de MongoDB Atlas.

**2. ¿Por qué la API devuelve `id` en lugar de `_id`?**
Devolver `id` como una cadena de texto estándar (`string`) desacopla el contrato público de la API de los detalles internos de implementación de la base de datos. Si el cliente dependiera de `_id` u objetos tipo `ObjectId`, la arquitectura filtraría detalles específicos de MongoDB, complicando el consumo de la API por parte de clientes frontend o aplicaciones externas. La función `toTask` transforma el `_id` interno en un `id` público limpio.

**3. ¿Qué problema evita migrar todas las operaciones a una sola fuente de datos?**
Evita el problema de tener "dos fuentes de verdad" o estados divergentes. Si solo `POST` y `GET` usaran MongoDB Atlas mientras que `PATCH` o `DELETE` permanecieran en memoria, una tarea creada en la base de datos no podría completarse ni eliminarse con fiabilidad. Al migrar todas las operaciones a `TaskModel`, se garantiza la coherencia e integridad transaccional de todo el ciclo de vida del recurso.

**4. ¿Qué reglas aplica el middleware y cuáles repite el esquema?**
* **El middleware:** Aplica validaciones a nivel de transporte HTTP. Verifica que la solicitud incluya encabezados válidos (`Content-Type: application/json`), que el parámetro `:id` tenga exactamente 24 caracteres hexadecimales conformes a un `ObjectId`, y que `title` y `description` sean cadenas no vacías dentro de los rangos permitidos (hasta 120 y 300 caracteres respectivamente).
* **El esquema:** Repite las reglas críticas de persistencia como defensa en profundidad (`required`, `trim`, `maxlength`, `enum`). Esto garantiza que, incluso si una operación se ejecuta por fuera del middleware HTTP (por ejemplo, mediante scripts o servicios internos), la base de datos nunca almacenará documentos con datos corruptos o fuera de norma.

**5. ¿Qué diferencia existe entre `INVALID_ID` y `TASK_NOT_FOUND`?**
* **`INVALID_ID` (400 Bad Request):** Es un error de validación de sintaxis/formato. Ocurre en el middleware `validateTaskId` cuando el valor provisto en la URL no cumple con el formato de 24 caracteres hexadecimales de un `ObjectId` (por ejemplo, `/api/tasks/1` o `/api/tasks/abc`).
* **`TASK_NOT_FOUND` (404 Not Found):** Es una regla de negocio. Ocurre cuando el identificador sí tiene un formato de `ObjectId` válido y legible, pero al consultar la colección en MongoDB Atlas no existe ningún documento registrado con ese identificador.

**6. ¿Qué hacen `timestamps` y `versionKey: false`?**
* **`timestamps: true`:** Le indica a Mongoose que gestione de manera automática los campos `createdAt` y `updatedAt` de tipo `Date`, registrando cuándo se insertó el documento y actualizando `updatedAt` cada vez que se modifica.
* **`versionKey: false`:** Desactiva la generación del campo interno `__v` que Mongoose utiliza por defecto para el control de versiones internas de arrays. Como esta API no requiere control de concurrencia optimista a nivel de subdocumentos, desactivarlo evita que se filtre metainformación técnica al cliente.

**7. ¿Por qué los controladores deben usar `async` y `await`?**
Las operaciones de acceso a datos contra MongoDB Atlas son asíncronas basadas en red y devuelven `Promise`. El uso de `async` y `await` permite esperar de forma no bloqueante a que la base de datos resuelva la consulta antes de construir y enviar la respuesta HTTP (`res.status(200).json(...)`). Si no se utilizara `await`, la API respondería antes de tener los datos o devolvería objetos `Promise` vacíos.

**8. ¿Cómo llega un `AppError` asíncrono al `errorHandler` de Express 5?**
Express 5 soporta de forma nativa la resolución de promesas en manejadores de ruta y controladores asíncronos. Cuando una función asíncrona lanza una excepción (`throw new AppError(...)`) o una promesa es rechazada, Express 5 intercepta automáticamente el rechazo y lo canaliza directamente hacia la cadena de middlewares de manejo de errores, alcanzando el `errorHandler` central sin necesidad de usar bloques `try/catch` manuales con llamadas a `next(error)` en cada controlador.

**9. ¿Qué prueba demuestra realmente que una tarea es persistente?**
Crear una tarea mediante `POST /api/tasks`, detener completamente el proceso del servidor Node.js (`SIGINT` o finalizar el comando en la terminal), volver a iniciar el servidor y consultar nuevamente `GET /api/tasks` y `GET /api/tasks/:id`. Si la tarea sigue existiendo y sus datos están intactos, se demuestra de forma concluyente que la información reside en MongoDB Atlas y no en la memoria volátil del proceso.

**10. ¿Qué información de Mongoose o Atlas nunca debe aparecer en la respuesta HTTP?**
Nunca deben exponerse: la cadena de conexión (`mongodb+srv://...`), credenciales de usuario o contraseñas, nombres de servidores o hosts del clúster (`cluster0.oqmag1v.mongodb.net`), direcciones IP internas, el campo interno `_id`, el campo `__v`, ni stack traces técnicos u objetos internos de errores del driver de MongoDB. Toda falla debe traducirse a mensajes de usuario seguros y contratos estandarizados (`AppError`).
