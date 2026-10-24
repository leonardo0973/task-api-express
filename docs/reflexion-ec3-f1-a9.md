# Reflexión — EC3 F1 A9 Registro, contraseñas y JWT

**1. ¿Por qué un hash de contraseña no debe poder descifrarse?**
Porque si alguien obtiene una copia de la colección `users`, no debe poder recuperar las contraseñas. bcrypt es una función de un solo sentido: para iniciar sesión no se "descifra" nada, se vuelve a calcular con `bcrypt.compare` y se compara con `passwordHash`. Si pudiera descifrarse, existiría una clave capaz de revelar todas las contraseñas, y muchas personas reutilizan la misma contraseña en otros sitios.

**2. ¿Qué diferencia existe entre una sal aleatoria y la clave usada para firmar HS256?**
La sal es un valor público y distinto para cada hash; bcrypt la guarda dentro del propio `passwordHash`. Sirve para que dos usuarios con la misma contraseña tengan hashes diferentes (lo comprobé en Atlas) y para inutilizar tablas precalculadas. `JWT_SECRET` es un secreto único de la API que nunca sale de `.env`; con él se firma y se verifica cada token. Si alguien conoce la sal no gana nada; si conoce `JWT_SECRET` puede fabricar tokens válidos.

**3. ¿Por qué passwordHash tiene select false y aun así el login puede recuperarlo?**
`select: false` hace que las consultas normales de Mongoose no devuelvan el hash, así que ningún flujo lo incluye por descuido. En el login, `findUserDocumentByEmail(email, true)` agrega `.select('+passwordHash')` de forma explícita, solo para comparar la contraseña. Después, `toUser` construye la respuesta pública sin ese campo.

**4. ¿Por qué unique no sustituye la validación HTTP del correo?**
`unique` crea un índice único en MongoDB; no comprueba formato. Un texto como `no-es-correo` se guardaría sin problema. Por eso el middleware valida el formato, la longitud y normaliza con `trim` y `toLowerCase` (caso N8, 422). A la vez, el índice único es la protección definitiva ante dos registros simultáneos con el mismo correo; el repositorio convierte el código 11000 en `409 USER_EMAIL_EXISTS`.

**5. ¿Qué riesgo evita rechazar el campo role durante el registro?**
Evita la escalada de privilegios por asignación masiva: si el endpoint aceptara el cuerpo completo, un cliente podría enviar `"role": "admin"` y crearse una cuenta de administrador. `validateRegister` solo permite `name`, `email`, `password` y `confirmPassword`, y el servicio fija `role: 'user'`. En la prueba N3 se respondió 422 y en Atlas hay 0 usuarios `admin`.

**6. ¿Por qué correo inexistente y contraseña incorrecta devuelven el mismo mensaje?**
Para no revelar qué correos tienen cuenta. Si el mensaje fuera "el correo no existe", un atacante podría enumerar usuarios. Ambos casos responden `401 INVALID_CREDENTIALS` con "El correo o la contraseña son incorrectos." (N4 y N5). Además, cuando el correo no existe se compara contra un hash ficticio para que bcrypt se ejecute igual y el tiempo de respuesta no delate el caso (en Postman ambos tardaron alrededor de 500 ms).

**7. ¿Qué información contiene el JWT de esta actividad y qué información se excluye?**
Contiene `sub` (id del usuario), `role`, `iss` (`task-api-express`), `aud` (`task-api-client`), `iat` y `exp` (1 hora después), con encabezado `alg HS256` y `typ JWT`. Se excluyen contraseña, `passwordHash`, nombre y correo: el JWT está firmado pero no cifrado y cualquiera que lo tenga puede leer sus claims.

**8. ¿Qué validan issuer, audience, algorithms y exp?**
`jwtVerify` comprueba la firma con `JWT_SECRET`, que `iss` sea el emisor esperado (que el token lo creó esta API), que `aud` sea el cliente esperado (que no es un token creado para otro sistema), que el algoritmo sea exactamente `HS256` (evita aceptar `none` u otro algoritmo) y que `exp` no haya pasado. Si algo falla, `verifyAccessToken` responde `401 INVALID_TOKEN`.

**9. ¿Cómo llega un error de MongoDB desde el repositorio hasta errorHandler en Express 5?**
`user.repository.ts` ejecuta cada operación dentro de `execute`; si Mongoose lanza un error, `mapPersistenceError` lo convierte en `AppError` (11000 → 409, `ValidationError` → 422, otro → 503 `DATABASE_UNAVAILABLE`, sin URI ni stack). El servicio hace `await` y el rechazo sube al controlador `postRegister`, que también es `async`. Express 5 detecta la promesa rechazada, llama `next(error)` y `errorHandler` responde con `code`, `message`, `details` y `requestId`.

**10. ¿Por qué las rutas de tareas permanecen públicas en A9 y qué cambiará en A10?**
A9 se limita a la autenticación: crear identidades, proteger contraseñas y emitir tokens. Mantener `/api/tasks` público permite comprobar por regresión que nada del CRUD ni de las consultas de A8 se rompió (R1–R6 sin `Authorization`). En A10 se agregará un middleware que lea `Authorization: Bearer <token>`, use `verifyAccessToken` para obtener `userId` y `role`, responda 401 si falta o es inválido, y aplique permisos por rol a las rutas de tareas.
