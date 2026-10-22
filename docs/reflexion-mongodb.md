# Reflexión — EC2 F1 A5 Configuración de MongoDB Atlas y conexión segura desde Express

> Borrador para revisar: reemplaza las preguntas por las de la sección "Preguntas de cierre"
> de la guía si son diferentes, y ajusta cada respuesta con tu propia experiencia.

**1. ¿Por qué la API se conecta con MongoDB antes de abrir el puerto?**
Si el puerto se abriera primero, la API aceptaría solicitudes que después no podría atender
cuando necesite la base de datos. Conectar antes asegura que, cuando la terminal muestra
"API disponible", la dependencia principal ya respondió. Si Atlas falla, el proceso termina
con código 1 y el problema se ve al arrancar, no cuando un cliente lo descubre.

**2. ¿Qué riesgo existe al usar un usuario con rol de administrador de Atlas?**
Si la cadena de conexión se filtrara, quien la tuviera podría leer, borrar o modificar
cualquier base de datos del proyecto. Con un usuario exclusivo `readWrite` sobre `task_api`,
el daño posible se limita a esa base de datos (principio de mínimo privilegio).

**3. ¿Por qué no se debe autorizar `0.0.0.0/0` en Network Access?**
Esa regla permite intentos de conexión desde cualquier IP del mundo; la contraseña sería la
única defensa. Al autorizar solo mi IP, una contraseña filtrada no basta para conectarse
desde otro lugar.

**4. ¿Qué función cumplen `.env`, `.env.example` y `.gitignore`?**
`.env` guarda los valores reales en mi equipo; `.gitignore` impide que Git lo registre;
`.env.example` documenta qué variables se necesitan sin valores reales, para que otra
persona pueda configurar el proyecto. `git check-ignore .env` y `git ls-files .env`
comprueban que el secreto no está en el repositorio.

**5. ¿Qué diferencia hay entre `/health` y `/health/database`?**
`/health` solo indica que el proceso de Express responde. `/health/database` hace un `ping`
real a MongoDB; puede fallar con `503 DATABASE_UNAVAILABLE` aunque el servidor siga vivo,
por ejemplo si se pierde la red.

**6. ¿Por qué no se muestran la URI, el host ni el stack en la respuesta o en la terminal?**
Los mensajes del driver pueden incluir el host del clúster, el usuario o la URI completa.
Esa información ayuda a un atacante y puede quedar en capturas o registros. Por eso se
traducen a mensajes propios y códigos estables.

**7. ¿Qué aporta el cierre ordenado?**
Evita cortar solicitudes a la mitad y deja libres las conexiones con Atlas. Primero se deja de
aceptar tráfico, luego se cierra el servidor HTTP y al final `mongoose.disconnect()`, de modo
que el proceso termina con código 0 y sin errores.

**8. ¿Qué prueba demuestra que no se rompió el trabajo de EC1?**
La regresión de la colección: los casos positivos y negativos de `/api/tasks` devuelven los
mismos códigos (200, 201, 204, 400, 404, 415 y 422) y el mismo contrato de error con
`requestId` que en EC1 F3 A4.
