import { Schema, model } from 'mongoose';

export const TASK_STATUSES = ['pending', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface TaskPersistence {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskUpdate {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

const taskSchema = new Schema<TaskPersistence>(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio.'],
      trim: true,
      maxlength: [120, 'El título no debe superar 120 caracteres.']
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'pending'
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const TaskModel = model<TaskPersistence>('Task', taskSchema);
