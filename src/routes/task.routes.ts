import { Router } from 'express';
import {
  getTask,
  getTasks,
  patchTask,
  patchTaskComplete,
  postTask,
  removeTask
} from '../controllers/task.controller.js';
import { requireJson } from '../middlewares/require-json.middleware.js';
import { validateTaskId } from '../middlewares/validate-task-id.middleware.js';
import { validateTaskTitle } from '../middlewares/validate-task-title.middleware.js';
import { validateTaskUpdate } from '../middlewares/validate-task-update.middleware.js';

export const taskRouter = Router();

taskRouter.param('id', validateTaskId);

taskRouter.get('/', getTasks);
taskRouter.get('/:id', getTask);
taskRouter.post('/', requireJson, validateTaskTitle, postTask);
taskRouter.patch('/:id', requireJson, validateTaskUpdate, patchTask);
taskRouter.patch('/:id/complete', patchTaskComplete);
taskRouter.delete('/:id', removeTask);
