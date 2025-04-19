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

// Tipo para cuando se recibe una tarea de la API
export interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  createdAt: string; // ISO date string
  dueDate: string;   // ISO date string
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  userId: string;
}

// Función helper para convertir ApiTask a Task
export function apiTaskToTask(apiTask: ApiTask): Task {
  return {
    ...apiTask,
    createdAt: new Date(apiTask.createdAt),
    dueDate: new Date(apiTask.dueDate)
  };
}