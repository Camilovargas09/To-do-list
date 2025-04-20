// src/app/components/ui/WeeklyView.tsx
"use client";

import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Task } from "@/app/types/task";

interface WeeklyViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

export default function WeeklyView({
  tasks,
  selectedDate,
  onDateChange,
  onTaskClick,
}: WeeklyViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    onDateChange(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(selectedDate, 1));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePreviousWeek}
          className="px-4 py-2 bg-amber-100 rounded-md hover:bg-amber-200"
        >
          Semana Anterior
        </button>

        <h2 className="text-xl font-semibold text-amber-900">
          Semana del {format(weekStart, "dd MMM", { locale: es })} al{" "}
          {format(weekEnd, "dd MMM yyyy", { locale: es })}
        </h2>

        <button
          onClick={handleNextWeek}
          className="px-4 py-2 bg-amber-100 rounded-md hover:bg-amber-200"
        >
          Semana Siguiente
        </button>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-4">
        {days.map((day) => (
          <div key={day.toString()} className="text-center">
            <div
              className={`font-medium text-sm p-1 ${
                isSameDay(day, new Date()) ? "bg-amber-100 rounded" : ""
              }`}
            >
              {format(day, "EEE", { locale: es })}
            </div>
            <div className="text-lg">{format(day, "d")}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => {
          // Filtrar tareas que vencen en este día
          const dayTasks = tasks.filter((task) => {
            const dueDate = new Date(task.dueDate);
            return isSameDay(dueDate, day);
          });

          // Determinar el color de fondo de la celda basado en si es hoy
          const cellBgColor = isSameDay(day, new Date())
            ? "bg-amber-50"
            : "bg-white";

          return (
            <div
              key={`tasks-${day.toString()}`}
              className={`border rounded p-2 min-h-36 ${cellBgColor}`}
            >
              {dayTasks.length === 0 ? (
                <p className="text-amber-800 text-xs">Sin tareas</p>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((task) => {
                    // Determinar el color de fondo según prioridad
                    const taskBgColor =
                      task.priority === "HIGH"
                        ? "bg-red-200"
                        : task.priority === "MEDIUM"
                        ? "bg-green-200"
                        : "bg-gray-200";

                    return (
                      <div
                        key={task.id}
                        className={`p-2 rounded text-sm cursor-pointer ${taskBgColor} ${
                          task.completed ? "opacity-50" : ""
                        }`}
                        onClick={() => onTaskClick(task)}
                      >
                        <div
                          className={`font-medium ${
                            task.completed ? "line-through" : ""
                          }`}
                        >
                          {task.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
