# Reflexión EC3 F2 A11

**1. ¿Qué parte de la aplicación se reemplaza con dobles en api.test.ts y qué parte sigue siendo real?**
Se reemplazan solo los servicios que tocan MongoDB: `auth.service` (`registerUser`, `loginUser`, `getAuthenticatedUser`) y `task.service` (listar, consultar, crear, actualizar, completar y eliminar), con `vi.mock` antes de importar `app`. Todo lo demás es real: `app.ts`, las rutas, `requestContext`, Helmet, CORS, `requireJson`, los middleware de validación, `authenticate`, `requireRole`, `token.service` (los tokens son JWT firmados de verdad), el `notFound` y el `errorHandler`. SuperTest manda las solicitudes directamente a `app` sin abrir un puerto.

**2. ¿Por qué una suite aprobada no demuestra que MongoDB Atlas esté configurado correctamente?**
Porque la suite nunca se conecta a Atlas: los servicios devuelven respuestas preparadas y `setup-env.ts` usa una URI de localhost que no se abre. Una suite en verde demuestra que rutas, middleware, validación, roles y contrato de errores funcionan, pero no que la cadena de conexión, el usuario de Atlas, Network Access o los índices estén bien. Para eso corrí la matriz manual con Atlas y Postman.

**3. ¿Qué diferencia existe entre OpenAPI y Swagger UI?**
OpenAPI es la especificación: un documento (en mi caso `src/docs/openapi.ts`, publicado en `/api-docs.json`) que describe rutas, parámetros, cuerpos, esquemas, seguridad y respuestas. Swagger UI es una página web que lee ese documento y lo muestra de forma navegable, con el botón Authorize y "Try it out" para enviar solicitudes reales. Una cosa es el contrato y la otra es la herramienta que lo presenta.

**4. ¿Por qué GET /api/auth/me obtiene el id desde el token y no desde params o body?**
Porque el token está firmado por la API y `authenticate` ya verificó la firma, el emisor, la audiencia y la expiración. Si el id llegara en la URL o en el cuerpo, cualquier usuario podría escribir el id de otra persona y consultar su identidad. Tomándolo de `res.locals.auth.userId`, el cliente solo puede ver su propia cuenta.

**5. ¿Por qué authRateLimiter ya no se monta en todo authRouter?**
En A10 el limitador estaba en todo el router porque solo había register y login. Con /me en el mismo router, cada recarga del cliente React gastaba intentos y un usuario normal podía recibir 429 sin haber probado ninguna contraseña. Consultar /me no es un intento de credenciales, así que el limitador ahora va solo en `POST /register` y `POST /login`. En la prueba con Atlas, 15 consultas seguidas a /me respondieron 200.

**6. ¿Qué diferencia hay entre un error 401 y uno 403 en el cliente?**
Un 401 significa que la sesión no sirve: falta el token, está vencido, es inválido o la cuenta ya no existe. El cliente React borra el token de `sessionStorage` y vuelve a mostrar el login. Un 403 significa que la sesión sí es válida, pero el rol no tiene permiso, como un `user` que intenta eliminar. Ahí no se cierra la sesión: solo se muestra el mensaje y el `requestId`.

**7. ¿Por qué Postman puede funcionar aunque el navegador informe CORS?**
CORS es una regla del navegador: antes de entregar la respuesta a JavaScript, revisa si el servidor permitió ese origen con `Access-Control-Allow-Origin`. Postman no es un navegador y no aplica esa regla, así que recibe la respuesta igual. Por eso la evidencia de CORS debe venir del navegador (el cliente en `http://localhost:5173`) o del encabezado `Origin`, no solo de Postman.

**8. ¿Qué riesgo conserva sessionStorage y por qué se usa solo como solución didáctica?**
El token en `sessionStorage` lo puede leer cualquier JavaScript que corra en la página. Si la aplicación tuviera una falla XSS, un script inyectado podría robar el token y usarlo hasta que expire. Se usa aquí porque A9 y A10 no implementaron cookies HttpOnly ni refresh tokens, y así se puede ver claramente el flujo Bearer. En producción conviene una cookie HttpOnly, Secure y SameSite, tokens de vida corta y renovación controlada.

**9. ¿Qué contrato comparten openapi.ts, types.ts y las respuestas reales?**
Los tres describen la misma forma de los datos: `data.user` con `id`, `name`, `email`, `role`, `createdAt` y `updatedAt` (sin `passwordHash`); el login con `user`, `accessToken`, `tokenType: "Bearer"` y `expiresIn`; las tareas con `id`, `title`, `status`, `priority` y fechas; el listado con `data` y `meta` (página, límite, total, páginas y si hay siguiente o anterior); y el error uniforme `{ error: { code, message, details?, requestId } }`. En el navegador las fechas llegan como texto JSON. Si cambia una respuesta real, hay que actualizar `openapi.ts`, `types.ts` y las pruebas al mismo tiempo.

**10. ¿Qué prueba agregarías primero antes de desplegar la actividad 12 y por qué?**
Una prueba de integración contra una base de datos de prueba real (por ejemplo, un clúster o contenedor de MongoDB solo para pruebas) que haga el flujo completo: registrar, iniciar sesión, consultar /me, crear, listar, completar y eliminar con admin. La suite actual aísla la base con dobles, así que no detecta errores de esquema, índices, conexión o mapeo de errores de Mongoose. Al desplegar cambian la URI, las variables y el origen de CORS, y esa prueba confirmaría que todo funciona junto antes de publicarlo.
