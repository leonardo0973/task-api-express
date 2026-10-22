import type { Task } from '../models/task.js';

// Almacenamiento temporal en memoria (EC1). La persistencia de tareas en
// MongoDB Atlas se incorporará en las siguientes actividades.
export const tasks: Task[] = [
  {
    id: 1,
    title: 'Configurar Express',
    status: 'completed',
    createdAt: new Date()
  },
  {
    id: 2,
    title: 'Probar la API con Postman',
    status: 'pending',
    createdAt: new Date()
  }
];
