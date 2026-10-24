# Evidencias EC3 F1 A9

## Datos generales
- Nombre: Leonardo (GitHub `leonardo0973`)
- Grupo: Programación Backend con Frameworks — 8.º semestre, Ingeniería en Sistemas, UES
- Repositorio y rama: `https://github.com/leonardo0973/task-api-express` · rama `ec3-a9-auth` (parte de `feature/consultas-paginadas`, A8)
- Commit final: último commit de la rama `ec3-a9-auth` — `docs: registra pruebas de autenticacion`

## Entorno verificado
- `node --version`: v24.19.0
- `pnpm --version`: 11.24.0
- Dependencias nuevas: `bcryptjs` 3.0.3 y `jose` 6.2.12 (versiones exactas). Mongoose se conserva en la línea 8.24 del proyecto (no se instaló Mongoose 9).
- `pnpm check`: aprobado (código 0)
- `pnpm build`: aprobado (código 0)
- `GET /health/database`: 200, `status ok`, `ping ok` (d739f651-3c48-4766-b68a-ad0294a5f139)
- `.env` ignorado (`git check-ignore -v .env` → regla `.env` de `.gitignore`; `git ls-files .env` vacío). `JWT_SECRET` se generó localmente con `randomBytes(32)` (64 caracteres hexadecimales) y no aparece en Git ni en este documento.

## Registro
- Solicitud utilizada, con contraseña reemplazada por `<OCULTA>`:
```json
{
  "name": "Ana Torres",
  "email": "Ana.Torres.<marca>@example.com",
  "password": "<OCULTA>",
  "confirmPassword": "<OCULTA>"
}
```
- Código HTTP: 201 (471adb9c-65b6-4cf5-a1ca-24f8bc568339)
- Respuesta sin datos sensibles: `data.user` con los campos `id, name, email, role, createdAt, updatedAt`; `role: "user"`; el correo llegó con mayúsculas y se respondió y guardó en minúsculas.
- Comprobación de que no aparece `passwordHash`: el cuerpo de la respuesta no contiene `password` ni `passwordHash` (test de Postman "No contiene password ni passwordHash").

## Inicio de sesión
- Solicitud, con contraseña reemplazada por `<OCULTA>`: `{ "email": "ana.torres.<marca>@example.com", "password": "<OCULTA>" }`
- Código HTTP: 200 (e11a9640-f682-4883-8cc6-16f176399e86)
- Campos recibidos; el token se reemplaza por `<TOKEN_OCULTO>`:
```json
{
  "data": {
    "user": { "id": "…", "name": "Ana Torres", "email": "ana.torres.<marca>@example.com", "role": "user", "createdAt": "…", "updatedAt": "…" },
    "accessToken": "<TOKEN_OCULTO>",
    "tokenType": "Bearer",
    "expiresIn": "1h"
  }
}
```
- Claims observados sin copiar el token (decodificación solo educativa): encabezado `alg HS256`, `typ JWT`; claims `role, sub, iss, aud, iat, exp`; `sub` = id del usuario (true); `role` = `user`; `iss` = `task-api-express`; `aud` = `task-api-client`; `exp − iat` = 3600 s (1 h). No contiene correo, nombre, contraseña ni hash.

## Pruebas negativas
| Caso | Código esperado | Código obtenido | `error.code` | Resultado |
|---|---:|---:|---|---|
| Correo repetido | 409 | 409 | `USER_EMAIL_EXISTS` | Aprobada (ccf372c0-134b-49e9-b9e0-7c242affc63c) |
| Contraseña corta | 422 | 422 | `AUTH_VALIDATION_ERROR` | Aprobada (c8c8af30-9ffd-4cb3-8d4a-de862a44476c) |
| Campo `role` | 422 | 422 | `AUTH_VALIDATION_ERROR` | Aprobada (4ac5118b-7a9b-4d98-867d-6778e656807e) |
| Credenciales incorrectas (contraseña) | 401 | 401 | `INVALID_CREDENTIALS` | Aprobada (4146025c-0e75-4586-836f-a0adfe843216) |
| Credenciales incorrectas (correo inexistente) | 401 | 401 | `INVALID_CREDENTIALS` | Aprobada (895a00d0-b3a7-4533-a193-1ab7f1d4a841) |
| Content-Type incorrecto | 415 | 415 | `UNSUPPORTED_MEDIA_TYPE` | Aprobada (805071d2-7bce-4dab-b241-f9d468d87aff) |
| JSON inválido | 400 | 400 | `INVALID_JSON` | Aprobada (3aedc762-4688-41a0-966a-14fc54f690a3) |
| Correo inválido | 422 | 422 | `AUTH_VALIDATION_ERROR` | Aprobada (712571c0-c608-4fa7-9b58-e188091f7104) |
| Contraseña > 72 bytes (40 × ñ) | 422 | 422 | `AUTH_VALIDATION_ERROR` | Aprobada (322be23c-5664-4be2-9a94-a6c2d67ded72) |
| Campo `passwordHash` | 422 | 422 | `AUTH_VALIDATION_ERROR` | Aprobada (2d175d67-8177-43a0-aa84-21da34c6a13f) |

- N4 y N5 devolvieron el mismo código y el mismo mensaje: "El correo o la contraseña son incorrectos.".
- Después del intento con `role: "admin"`, iniciar sesión con ese correo devolvió 401: el usuario no se creó.

## Regresión de tareas
Todas sin encabezado `Authorization`:
- Crear: `POST /api/tasks {"title":"Probar A9"}` → 201 (1adcb36f-35c9-442a-9011-94c7bf67aeba)
- Listar con paginación y filtros: `GET /api/tasks?page=1&limit=5` → 200 (`meta.limit 5`); `GET /api/tasks?status=completed&search=A9&sortBy=title&order=asc` → 200
- Actualizar: `PATCH /api/tasks/:id` → 200
- Completar: `PATCH /api/tasks/:id/complete` → 200 (`status completed`)
- Eliminar: `DELETE /api/tasks/:id` → 204 sin cuerpo
- Errores de tareas conservan `requestId` y códigos: `GET /api/tasks/123` → 400 `INVALID_ID`; `GET /health` → 200.

## Seguridad observada
Revisión de la colección `users` en Atlas con un script que solo imprime resultados booleanos (sin hashes ni URI):
- ¿La colección guarda `password` o solo `passwordHash`? Solo `passwordHash`. Campos del documento: `_id, name, email, passwordHash, role, createdAt, updatedAt`. Documentos con `password` o `confirmPassword`: 0.
- El hash tiene prefijo bcrypt `$2b$12$` (true) y 60 caracteres. Dos usuarios registrados con la misma contraseña tienen hashes distintos (true) por la sal aleatoria.
- El correo se almacena en minúsculas (true) y existe el índice único `email_1` (unique true).
- ¿Alguna respuesta expone `passwordHash`, URI, secreto o stack trace? No. Los errores solo devuelven `code`, `message`, `details` y `requestId`.
- ¿El cliente puede asignarse `admin`? No: `role` se rechaza con 422 y en Atlas hay 0 usuarios con rol `admin`.

## Todos los casos ejecutados
| Caso | Ruta | Esperado | Obtenido | `error.code` | requestId | Resultado |
|---|---|---:|---:|---|---|---|
| Salud | GET /health/database | 200 | 200 | `—` | d739f651-3c48-4766-b68a-ad0294a5f139 | Aprobada |
| P1 | POST /api/auth/register | 201 | 201 | `—` | 471adb9c-65b6-4cf5-a1ca-24f8bc568339 | Aprobada |
| P2 | POST /api/auth/login | 200 | 200 | `—` | e11a9640-f682-4883-8cc6-16f176399e86 | Aprobada |
| P3 | POST /api/auth/register (misma contraseña, otro correo) | 201 | 201 | `—` | 957c823c-e3cd-405f-b025-955a129ec805 | Aprobada |
| N1 | POST /api/auth/register correo repetido | 409 | 409 | `USER_EMAIL_EXISTS` | ccf372c0-134b-49e9-b9e0-7c242affc63c | Aprobada |
| N2 | POST /api/auth/register contraseña corta | 422 | 422 | `AUTH_VALIDATION_ERROR` | c8c8af30-9ffd-4cb3-8d4a-de862a44476c | Aprobada |
| N3 | POST /api/auth/register con role admin | 422 | 422 | `AUTH_VALIDATION_ERROR` | 4ac5118b-7a9b-4d98-867d-6778e656807e | Aprobada |
| N3b | POST /api/auth/login del intento admin | 401 | 401 | `INVALID_CREDENTIALS` | eb7368d8-225a-450a-b140-527ac14238d1 | Aprobada |
| N4 | POST /api/auth/login contraseña incorrecta | 401 | 401 | `INVALID_CREDENTIALS` | 4146025c-0e75-4586-836f-a0adfe843216 | Aprobada |
| N5 | POST /api/auth/login correo inexistente | 401 | 401 | `INVALID_CREDENTIALS` | 895a00d0-b3a7-4533-a193-1ab7f1d4a841 | Aprobada |
| N6 | POST /api/auth/login Content-Type text/plain | 415 | 415 | `UNSUPPORTED_MEDIA_TYPE` | 805071d2-7bce-4dab-b241-f9d468d87aff | Aprobada |
| N7 | POST /api/auth/login JSON incompleto | 400 | 400 | `INVALID_JSON` | 3aedc762-4688-41a0-966a-14fc54f690a3 | Aprobada |
| N8 | POST /api/auth/register correo inválido | 422 | 422 | `AUTH_VALIDATION_ERROR` | 712571c0-c608-4fa7-9b58-e188091f7104 | Aprobada |
| N9 | POST /api/auth/register contraseña > 72 bytes (40 ñ) | 422 | 422 | `AUTH_VALIDATION_ERROR` | 322be23c-5664-4be2-9a94-a6c2d67ded72 | Aprobada |
| N10 | POST /api/auth/register campo passwordHash | 422 | 422 | `AUTH_VALIDATION_ERROR` | 2d175d67-8177-43a0-aa84-21da34c6a13f | Aprobada |
| D1 | POST /api/auth/register confirmPassword distinto | 422 | 422 | `AUTH_VALIDATION_ERROR` | 9a52ccb8-6ed1-4eb5-9804-c40202506dad | Aprobada |
| D2 | POST /api/auth/register sin confirmPassword | 422 | 422 | `AUTH_VALIDATION_ERROR` | 24dc33d1-62d9-4256-9fe6-f2864e36fa58 | Aprobada |
| D3 | POST /api/auth/register confirmPassword coincide | 201 | 201 | `—` | 55766b60-e8a5-4f7c-ba56-0ea40388727d | Aprobada |
| R1 | GET /api/tasks?page=1&limit=5 | 200 | 200 | `—` | 76b904fc-920e-43df-b46d-da65c5c7601c | Aprobada |
| R2 | POST /api/tasks {"title":"Probar A9"} | 201 | 201 | `—` | 1adcb36f-35c9-442a-9011-94c7bf67aeba | Aprobada |
| R3 | PATCH /api/tasks/:id | 200 | 200 | `—` | d7872d4a-1218-477b-878e-e32a9de78ebb | Aprobada |
| R4 | PATCH /api/tasks/:id/complete | 200 | 200 | `—` | 5937e69f-7b74-4d5d-b637-ba77e25100d7 | Aprobada |
| R5 | GET /api/tasks?status=completed&search=A9&sortBy=title&order=asc | 200 | 200 | `—` | 53af7c37-248d-4bee-8357-1e93acc2e34f | Aprobada |
| R6 | DELETE /api/tasks/:id | 204 | 204 | `—` | 7cc64cdb-6c0d-4560-803b-49e7669ec090 | Aprobada |
| R7 | GET /api/tasks/123 (error conserva requestId) | 400 | 400 | `INVALID_ID` | 8868cffc-8b37-4c71-802d-3e761c035e9e | Aprobada |
| R8 | GET /health | 200 | 200 | `—` | e059324c-6d32-4ded-9cf4-636a638746e2 | Aprobada |

Resumen: 26/26 casos aprobados con el script local, y 37/37 tests aprobados en el Runner de Postman (`postman/Task API EC3 F1 A9.postman_collection.json`, 18 solicitudes).

Capturas (sin token, contraseña ni URI): `docs/capturas/a9-01-runner-registro-login.jpg` y `docs/capturas/a9-02-runner-negativas.jpg`.

## Desafío individual: confirmPassword
- `confirmPassword` se agregó solo al contrato HTTP: `validateRegister` lo exige, comprueba que sea igual a `password` y **no lo copia** a `RegisterInput`.
- Contraseñas coincidentes → 201 y la respuesta no incluye `confirmPassword`.
- Contraseñas diferentes → 422 `AUTH_VALIDATION_ERROR` con field `confirmPassword`. Sin `confirmPassword` → 422.
- MongoDB no contiene `confirmPassword` (documentos con ese campo: 0). Login y CRUD de tareas siguen funcionando.
- ¿Por qué pertenece a la frontera HTTP? Es una ayuda para evitar errores de escritura del usuario en el formulario; no es un dato del usuario. Si llegara al servicio o al modelo, se guardaría una segunda copia de la contraseña o se mezclaría una regla de interfaz con la persistencia. Validarla en el middleware y descartarla mantiene el modelo igual y evita cualquier copia de la contraseña en texto plano.

## Conclusión
Se comprobó que la API registra usuarios con correo único y normalizado, guarda solo un hash bcrypt de 12 rondas, rechaza `role`, campos desconocidos y contraseñas fuera de límites, y emite un JWT HS256 con `sub`, `role`, `iss`, `aud` y expiración de 1 h. El login usa el mismo error para correo inexistente y contraseña incorrecta. El CRUD, la paginación, los filtros, la búsqueda y el orden de A8 siguen funcionando sin token.

Queda pendiente para A10: crear el middleware que lea `Authorization: Bearer`, use `verifyAccessToken` (ya implementado) para convertir el token en `userId` y `role`, proteger `/api/tasks` y aplicar permisos por rol.
