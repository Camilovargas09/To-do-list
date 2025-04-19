// src/app/types/task.ts
export interface Task {
    id: string;
    title: string;
    description?: string | null;
    createdAt: Date;
    dueDate: Date;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    completed: boolean;
    userId: string;
  }