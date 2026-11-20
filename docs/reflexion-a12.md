# Reflexión EC3 F3 A12

**1. ¿Cuál es la diferencia entre build, deploy y release?**
El *build* transforma el código en algo ejecutable: `pnpm build` compila TypeScript a `dist/` y `pnpm client:build` genera el sitio estático en `client/dist`. El *deploy* pone ese resultado a correr en una infraestructura accesible: Render ejecutó el build del commit `5244373`, arrancó `pnpm start` y publicó las dos URLs HTTPS. El *release* es una versión identificable que pasó criterios de calidad: la 1.0.0 existe porque `pnpm verify`, la matriz de aceptación (18/18) y `pnpm smoke:release` aprobaron, y la etiqueta `v1.0.0` marca exactamente ese commit. Un deploy puede existir sin release (por ejemplo, un despliegue de prueba).

**2. ¿Por qué PUBLIC_API_URL puede ser pública y JWT_SECRET no?**
`PUBLIC_API_URL` solo dice dónde está la API (`https://task-api-express-leonardo0973.onrender.com`). Cualquiera la ve en Swagger o en el navegador y conocerla no da acceso a nada. `JWT_SECRET` firma los tokens: con él, alguien podría fabricar un token con `role: admin` y la API lo aceptaría como válido. Por eso Render lo generó con `generateValue: true` y nunca aparece en Git, en el código ni en las capturas.

**3. ¿Qué riesgo introduce configurar trust proxy como true sin conocer la topología?**
Con `true`, Express confía en cualquier `X-Forwarded-For`, incluso uno inventado por el cliente. Un atacante podría cambiar ese encabezado en cada intento y el limitador de login lo vería como una IP distinta cada vez, así que podría saltarse el límite de 10 intentos. Con `TRUST_PROXY_HOPS=1` Express solo confía en el salto del proxy de Render; en local vale 0 y no se confía en nadie.

**4. ¿Por qué ocultar un botón en React no autoriza ni prohíbe una operación?**
El botón Eliminar solo se dibuja si `user.role === 'admin'`, pero eso es experiencia de usuario. Cualquiera puede mandar un `DELETE /api/tasks/:id` con Postman o con la consola del navegador. La autorización real está en Express (`requireRole('admin')`): en producción, el `DELETE` con un token de `user` respondió 403 `FORBIDDEN` y la tarea no se eliminó.

**5. ¿Por qué VITE_API_URL requiere un nuevo build cuando cambia?**
Vite reemplaza `import.meta.env.VITE_API_URL` por el texto de la URL al construir el bundle: la URL queda escrita dentro del JavaScript de `client/dist`. El sitio estático no lee variables en tiempo de ejecución, así que si la URL cambia hay que volver a ejecutar `pnpm client:build` (en Render, un nuevo deploy del sitio).

**6. ¿Qué comprueba /health/database que no comprueba /health?**
`/health` solo confirma que el proceso de Node responde e informa versión y ambiente (`up`, `1.0.0`, `production`). `/health/database` además hace un `ping` a MongoDB Atlas: responde 200 `up` si la base contesta y 503 `down` si no. Por eso Render usa `/health/database` como health check: un proceso vivo pero sin base de datos no sirve para atender tareas.

**7. ¿Qué cubren las pruebas con servicios simulados y qué debe comprobarse con Atlas?**
Las 7 pruebas del backend reemplazan `auth.service` y `task.service` con dobles y comprueban rutas, validación, JWT, roles, CORS, Helmet y el contrato de errores sin red. Las 3 del cliente reemplazan `fetch` y comprueban la URL, el Bearer, el 204 y el error. Con Atlas hay que comprobar lo que los dobles no ven: la cadena de conexión, el usuario, la lista de acceso de red, los índices y la persistencia real. Eso lo cubrieron la matriz local (18/18) y la de producción (18/18).

**8. ¿Por qué una respuesta 204 necesita tratamiento especial en el cliente?**
204 No Content no trae cuerpo. Si el cliente intentara `JSON.parse` sobre un texto vacío fallaría aunque la eliminación haya sido exitosa. `apiRequest` lee el texto, solo lo analiza si existe y devuelve `undefined` cuando el estado es 204; `deleteTask` es `Promise<void>`. La prueba "acepta una eliminación 204 sin intentar analizar JSON" lo confirma.

**9. ¿Cómo confirmarías que la etiqueta v1.0.0 corresponde al código desplegado?**
Comparo tres datos: el commit que Render muestra en el último deploy de los dos servicios (`5244373`), `git rev-parse HEAD` en la laptop y `git rev-list -n 1 v1.0.0`. El script solo creó la etiqueta cuando el commit desplegado coincidió con HEAD. Los commits posteriores (desafío y evidencias) llevan `[skip render]`, así que producción sigue en el commit etiquetado.

**10. ¿Qué evidencia omitirías o redactarías antes de entregar y por qué?**
Omití la URI de MongoDB, el `JWT_SECRET`, las contraseñas y los tokens completos, porque cualquiera de ellos da acceso a la base o permite fabricar sesiones. No capturé el panel Environment de Render con valores visibles, oculté el bloque cURL de Swagger (lleva el token), tapé mi correo personal en las capturas de React y la prueba de humo lee la contraseña de una variable sin imprimirla. Los `requestId` y las URLs públicas sí se muestran porque no dan acceso.
