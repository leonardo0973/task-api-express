# Lista de liberación 1.0.0

Marcada el 19/11/2026 con la evidencia de `docs/evidencias-a12.md` (commit desplegado `5244373`, etiqueta `v1.0.0`).

## Calidad local

- [x] `pnpm install --frozen-lockfile` termina correctamente.
- [x] `pnpm verify` termina sin errores.
- [x] La API y el cliente funcionan en desarrollo.

## Producción

- [x] Los nombres de servicios en `render.yaml` fueron personalizados.
- [x] Las variables sensibles se registraron en Render y no en Git.
- [x] MongoDB Atlas autoriza solo las direcciones de salida necesarias.
- [x] `PUBLIC_API_URL`, `VITE_API_URL` y `CORS_ORIGIN` usan HTTPS y coinciden.
- [x] `/health/database` informa estado `up`.
- [x] Swagger UI utiliza la URL pública de la API.

## Aceptación

- [x] Registro e inicio de sesión funcionan desde el cliente publicado.
- [x] Un usuario puede crear, listar, buscar, editar y completar tareas.
- [x] Un usuario normal no puede eliminar tareas.
- [x] Un administrador puede eliminar tareas.
- [x] Un token ausente o inválido produce `401`.
- [x] Un origen no permitido no recibe encabezado CORS.
- [x] `pnpm smoke:release` finaliza correctamente.

## Liberación

- [x] Las evidencias no muestran contraseñas, tokens ni la URI de MongoDB.
- [x] `CHANGELOG.md` describe la versión.
- [x] El commit final está en GitHub.
- [x] La etiqueta `v1.0.0` fue creada y enviada.
