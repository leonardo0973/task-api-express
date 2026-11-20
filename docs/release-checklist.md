# Lista de liberación 1.0.0

## Calidad local

- [ ] `pnpm install --frozen-lockfile` termina correctamente.
- [ ] `pnpm verify` termina sin errores.
- [ ] La API y el cliente funcionan en desarrollo.

## Producción

- [ ] Los nombres de servicios en `render.yaml` fueron personalizados.
- [ ] Las variables sensibles se registraron en Render y no en Git.
- [ ] MongoDB Atlas autoriza solo las direcciones de salida necesarias.
- [ ] `PUBLIC_API_URL`, `VITE_API_URL` y `CORS_ORIGIN` usan HTTPS y coinciden.
- [ ] `/health/database` informa estado `up`.
- [ ] Swagger UI utiliza la URL pública de la API.

## Aceptación

- [ ] Registro e inicio de sesión funcionan desde el cliente publicado.
- [ ] Un usuario puede crear, listar, buscar, editar y completar tareas.
- [ ] Un usuario normal no puede eliminar tareas.
- [ ] Un administrador puede eliminar tareas.
- [ ] Un token ausente o inválido produce `401`.
- [ ] Un origen no permitido no recibe encabezado CORS.
- [ ] `pnpm smoke:release` finaliza correctamente.

## Liberación

- [ ] Las evidencias no muestran contraseñas, tokens ni la URI de MongoDB.
- [ ] `CHANGELOG.md` describe la versión.
- [ ] El commit final está en GitHub.
- [ ] La etiqueta `v1.0.0` fue creada y enviada.
