// Prueba de humo posterior al despliegue. Lee API_URL, USER_EMAIL y
// USER_PASSWORD del proceso. Es de solo lectura y nunca imprime la
// contraseña ni el token.
const requireValue = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
};

const apiUrl = requireValue('API_URL').replace(/\/$/, '');
const email = requireValue('USER_EMAIL');
const password = requireValue('USER_PASSWORD');

const requestJson = async (path, init = {}) => {
  const response = await fetch(`${apiUrl}${path}`, init);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    const code = payload?.error?.code ?? `HTTP_${response.status}`;
    throw new Error(`${path} falló con ${response.status} (${code}).`);
  }
  return payload;
};

try {
  const health = await requestJson('/health');
  if (health?.data?.status !== 'up') throw new Error('/health no informó status up.');
  console.log(`✓ API ${health.data.version} en ambiente ${health.data.environment}`);

  const database = await requestJson('/health/database');
  if (database?.data?.status !== 'up') throw new Error('MongoDB no informó status up.');
  console.log('✓ MongoDB conectado');

  const login = await requestJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const token = login?.data?.accessToken;
  if (typeof token !== 'string') throw new Error('El inicio de sesión no devolvió un token.');
  console.log('✓ Inicio de sesión correcto');

  const authorization = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const me = await requestJson('/api/auth/me', { headers: authorization });
  if (me?.data?.user?.email !== email.toLowerCase()) {
    throw new Error('/api/auth/me no devolvió la identidad esperada.');
  }
  console.log('✓ Identidad autenticada correcta');

  const tasks = await requestJson('/api/tasks?limit=5&sortBy=createdAt&order=desc', {
    headers: authorization
  });
  if (!Array.isArray(tasks?.data)) throw new Error('La lista de tareas no es un arreglo.');
  console.log(`✓ Lista protegida disponible (${tasks.data.length} elementos recibidos)`);
  console.log('Prueba de humo finalizada sin exponer la contraseña ni el token.');
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : 'Error desconocido.'}`);
  process.exitCode = 1;
}
