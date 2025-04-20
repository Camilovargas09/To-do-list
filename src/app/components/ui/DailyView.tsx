// src/app/components/ui/DailyView.tsx
'use client';

import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task } from '@/app/types/task';
import TaskList from '../tasks/TaskList';

interface DailyViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTasksChange: (tasks: Task[]) => void;
  onTaskClick: (task: Task) => void;
}

export default function DailyView({ tasks, selectedDate, onDateChange, onTasksChange, onTaskClick }: DailyViewProps) {
  // Filtrar tareas para el día seleccionado
  const filteredTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => onDateChange(addDays(selectedDate, -1))}
          className="px-4 py-2 bg-amber-100 rounded-md hover:bg-amber-200"
        >
          Anterior
        </button>
        
        <h2 className="text-xl font-semibold text-amber-900">
          {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: es })}
        </h2>
        
        <button 
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          className="px-4 py-2 bg-amber-100 rounded-md hover:bg-amber-200"
        >
          Siguiente
        </button>
      </div>
      
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-amber-800 text-lg">No hay tareas para este día</p>
        </div>
      ) : (
        <TaskList 
          tasks={filteredTasks} 
          onTasksChange={onTasksChange}
          onTaskClick={onTaskClick}
        />
      )}
    </div>
  );
}