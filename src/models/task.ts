export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: Date;
}
