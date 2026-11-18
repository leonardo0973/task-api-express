// Contrato OpenAPI 3.1 de task-api-express. Describe el comportamiento real
// de middleware, controladores y AppError; no ejecuta validación.
const json = (schema: Record<string, unknown>) => ({
  'application/json': { schema }
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const response = (name: string) => ({ $ref: `#/components/responses/${name}` });
const parameter = (name: string) => ({ $ref: `#/components/parameters/${name}` });
const bearer = [{ bearerAuth: [] }];

const errorResponse = (description: string) => ({
  description,
  content: json(ref('ErrorEnvelope'))
});

export const openApiDocument: Record<string, unknown> = {
  openapi: '3.1.0',
  info: {
    title: 'Task API Express',
    version: '1.0.0',
    description:
      'API REST para gestionar tareas con autenticación JWT y autorización por roles.'
  },
  servers: [{ url: 'http://localhost:3000', description: 'Entorno local' }],
  tags: [
    { name: 'Health', description: 'Comprobación del servicio' },
    { name: 'Auth', description: 'Registro, acceso e identidad autenticada' },
    { name: 'Tasks', description: 'CRUD protegido de tareas' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Comprobar que la API responde',
        responses: {
          '200': {
            description: 'Servicio disponible',
            content: json({
              type: 'object',
              required: ['status'],
              properties: { status: { type: 'string', const: 'ok' } }
            })
          }
        }
      }
    },
    '/health/database': {
      get: {
        tags: ['Health'],
        summary: 'Comprobar la conexión con MongoDB (ping)',
        responses: {
          '200': {
            description: 'Base de datos conectada',
            content: json({
              type: 'object',
              required: ['data'],
              properties: {
                data: {
                  type: 'object',
                  required: ['status', 'database', 'ping', 'latencyMs'],
                  properties: {
                    status: { type: 'string', const: 'ok' },
                    database: { type: 'string', example: 'task_api' },
                    ping: { type: 'string', const: 'ok' },
                    latencyMs: { type: 'integer', example: 42 }
                  }
                }
              }
            })
          },
          '503': response('DatabaseUnavailable')
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar una cuenta de usuario',
        requestBody: { required: true, content: json(ref('RegisterInput')) },
        responses: {
          '201': { description: 'Cuenta creada', content: json(ref('UserEnvelope')) },
          '400': response('InvalidJson'),
          '409': response('Conflict'),
          '415': response('UnsupportedMediaType'),
          '422': response('ValidationError'),
          '429': response('RateLimited')
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión y obtener un access token',
        requestBody: { required: true, content: json(ref('LoginInput')) },
        responses: {
          '200': {
            description: 'Credenciales correctas',
            content: json(ref('LoginEnvelope'))
          },
          '400': response('InvalidJson'),
          '401': response('Unauthorized'),
          '415': response('UnsupportedMediaType'),
          '422': response('ValidationError'),
          '429': response('RateLimited')
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener el usuario asociado al token',
        security: bearer,
        responses: {
          '200': { description: 'Identidad autenticada', content: json(ref('UserEnvelope')) },
          '401': response('Unauthorized')
        }
      }
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Listar tareas con paginación, filtros, búsqueda y ordenamiento',
        security: bearer,
        parameters: [
          parameter('Page'),
          parameter('Limit'),
          parameter('Status'),
          parameter('Search'),
          parameter('SortBy'),
          parameter('Order'),
          parameter('CreatedFrom'),
          parameter('CreatedTo')
        ],
        responses: {
          '200': { description: 'Lista paginada', content: json(ref('TaskListResult')) },
          '401': response('Unauthorized'),
          '422': response('QueryValidationError')
        }
      },
      post: {
        tags: ['Tasks'],
        summary: 'Crear una tarea',
        security: bearer,
        requestBody: { required: true, content: json(ref('CreateTaskInput')) },
        responses: {
          '201': { description: 'Tarea creada', content: json(ref('TaskEnvelope')) },
          '400': response('InvalidJson'),
          '401': response('Unauthorized'),
          '415': response('UnsupportedMediaType'),
          '422': response('ValidationError')
        }
      }
    },
    '/api/tasks/{id}': {
      parameters: [parameter('TaskId')],
      get: {
        tags: ['Tasks'],
        summary: 'Consultar una tarea',
        security: bearer,
        responses: {
          '200': { description: 'Tarea encontrada', content: json(ref('TaskEnvelope')) },
          '400': response('InvalidId'),
          '401': response('Unauthorized'),
          '404': response('NotFound')
        }
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Modificar título, estado o prioridad de una tarea',
        security: bearer,
        requestBody: { required: true, content: json(ref('UpdateTaskInput')) },
        responses: {
          '200': { description: 'Tarea modificada', content: json(ref('TaskEnvelope')) },
          '400': response('InvalidId'),
          '401': response('Unauthorized'),
          '404': response('NotFound'),
          '415': response('UnsupportedMediaType'),
          '422': response('ValidationError')
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Eliminar una tarea (solo administrador)',
        security: bearer,
        responses: {
          '204': { description: 'Tarea eliminada, sin cuerpo' },
          '400': response('InvalidId'),
          '401': response('Unauthorized'),
          '403': response('Forbidden'),
          '404': response('NotFound')
        }
      }
    },
    '/api/tasks/{id}/complete': {
      parameters: [parameter('TaskId')],
      patch: {
        tags: ['Tasks'],
        summary: 'Marcar una tarea como completada',
        security: bearer,
        responses: {
          '200': { description: 'Tarea completada', content: json(ref('TaskEnvelope')) },
          '400': response('InvalidId'),
          '401': response('Unauthorized'),
          '404': response('NotFound')
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    parameters: {
      TaskId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'ObjectId de MongoDB (24 caracteres hexadecimales)',
        schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }
      },
      Page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100000, default: 1 }
      },
      Limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
      },
      Status: {
        name: 'status',
        in: 'query',
        schema: { type: 'string', enum: ['pending', 'completed'] }
      },
      Search: {
        name: 'search',
        in: 'query',
        description: 'Búsqueda parcial en el título, sin distinguir mayúsculas',
        schema: { type: 'string', minLength: 1, maxLength: 60 }
      },
      SortBy: {
        name: 'sortBy',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['createdAt', 'updatedAt', 'title', 'status'],
          default: 'createdAt'
        }
      },
      Order: {
        name: 'order',
        in: 'query',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
      },
      CreatedFrom: {
        name: 'createdFrom',
        in: 'query',
        description: 'Fecha ISO 8601 mínima de createdAt (desafío A8)',
        schema: { type: 'string', format: 'date-time' }
      },
      CreatedTo: {
        name: 'createdTo',
        in: 'query',
        description: 'Fecha ISO 8601 máxima de createdAt (desafío A8)',
        schema: { type: 'string', format: 'date-time' }
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', example: '67112bfe47963b2be12c43a1' },
          name: { type: 'string', example: 'Ana Torres' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          role: { type: 'string', enum: ['user', 'admin'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Task: {
        type: 'object',
        required: ['id', 'title', 'status', 'priority', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', example: '67112bfe47963b2be12c43a2' },
          title: { type: 'string', example: 'Documentar la API' },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          email: { type: 'string', format: 'email', maxLength: 254 },
          password: {
            type: 'string',
            minLength: 15,
            format: 'password',
            description: 'Mínimo 15 caracteres y máximo 72 bytes en UTF-8'
          },
          confirmPassword: {
            type: 'string',
            format: 'password',
            description: 'Opcional; si se envía debe coincidir con password'
          }
        }
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        }
      },
      CreateTaskInput: {
        type: 'object',
        required: ['title'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      },
      UpdateTaskInput: {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      },
      ErrorDetail: {
        type: 'object',
        additionalProperties: true,
        properties: {
          field: { type: 'string' },
          message: { type: 'string' }
        }
      },
      ApiError: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'La solicitud contiene datos inválidos.' },
          details: { type: 'array', items: ref('ErrorDetail') },
          requestId: { type: 'string', format: 'uuid' }
        }
      },
      ErrorEnvelope: {
        type: 'object',
        required: ['error'],
        properties: { error: ref('ApiError') }
      },
      UserEnvelope: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['user'],
            properties: { user: ref('User') }
          }
        }
      },
      LoginEnvelope: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['user', 'accessToken', 'tokenType', 'expiresIn'],
            properties: {
              user: ref('User'),
              accessToken: { type: 'string' },
              tokenType: { type: 'string', const: 'Bearer' },
              expiresIn: { type: 'string', example: '1h' }
            }
          }
        }
      },
      TaskEnvelope: {
        type: 'object',
        required: ['data'],
        properties: { data: ref('Task') }
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNextPage: { type: 'boolean' },
          hasPreviousPage: { type: 'boolean' }
        }
      },
      TaskListResult: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: { type: 'array', items: ref('Task') },
          meta: ref('PaginationMeta')
        }
      }
    },
    responses: {
      Unauthorized: errorResponse(
        'Token ausente, con formato inválido, vencido o sin cuenta asociada ' +
        '(AUTHENTICATION_REQUIRED, INVALID_AUTHORIZATION_HEADER, INVALID_TOKEN, ' +
        'AUTHENTICATED_USER_NOT_FOUND) o credenciales incorrectas (INVALID_CREDENTIALS)'
      ),
      Forbidden: errorResponse('El rol autenticado no tiene permiso (FORBIDDEN)'),
      NotFound: errorResponse('Recurso inexistente (TASK_NOT_FOUND)'),
      Conflict: errorResponse('Ya existe una cuenta con ese correo (USER_EMAIL_EXISTS)'),
      InvalidId: errorResponse('El id no es un ObjectId válido (INVALID_ID)'),
      InvalidJson: errorResponse('El cuerpo contiene JSON inválido (INVALID_JSON)'),
      UnsupportedMediaType: errorResponse(
        'El cuerpo no utiliza application/json (UNSUPPORTED_MEDIA_TYPE)'
      ),
      ValidationError: errorResponse(
        'Cuerpo inválido (VALIDATION_ERROR o AUTH_VALIDATION_ERROR) con details por campo'
      ),
      QueryValidationError: errorResponse(
        'Parámetros de consulta inválidos (QUERY_VALIDATION_ERROR) con details por campo'
      ),
      RateLimited: errorResponse(
        'Se superó el límite temporal de autenticación (AUTH_RATE_LIMIT_EXCEEDED)'
      ),
      DatabaseUnavailable: errorResponse(
        'MongoDB no está disponible (DATABASE_UNAVAILABLE)'
      )
    }
  }
};
