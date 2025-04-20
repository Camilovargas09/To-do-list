// src/app/components/ui/MonthlyView.tsx
"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { Task } from "@/app/types/task";

interface MonthlyViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

export default function MonthlyView({
  tasks,
  selectedDate,
  onDateChange,
  onTaskClick,
}: MonthlyViewProps) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Agrupar días en semanas
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePreviousMonth}
          className="px-4 py-2 bg-amber-100 rounded-md hover:bg-amber-200"
        >
          Mes Anterior
        </button>

        <h2 className="text-xl font-semibold text-amber-900">
          {format(selectedDate, "MMMM yyyy", { locale: es })}
        </h2>

        <button
          onClick={handleNextMonth}
          className="px-4 py-2 bg-amber-100 rounded-md hover:bg-amber-200"
        >
          Mes Siguiente
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dayName) => (
          <div key={dayName} className="text-center font-medium text-sm py-1">
            {dayName}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => (
        <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((day) => {
            // Filtrar tareas que vencen en este día
            const dayTasks = tasks.filter((task) => {
              const dueDate = new Date(task.dueDate);
              return isSameDay(dueDate, day);
            });

            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`border rounded p-1 min-h-24 ${
                  !isCurrentMonth
                    ? "bg-gray-100 opacity-50"
                    : isToday
                    ? "bg-amber-50"
                    : "bg-white"
                }`}
              >
                <div className="text-right text-sm mb-1">
                  {format(day, "d")}
                </div>

                {dayTasks.length > 0 && (
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task) => {
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
                          className={`px-1 py-0.5 rounded-sm text-xs cursor-pointer ${taskBgColor} ${
                            task.completed ? "opacity-50" : ""
                          }`}
                          onClick={() => onTaskClick(task)}
                        >
                          <div
                            className={`truncate ${
                              task.completed ? "line-through" : ""
                            }`}
                          >
                            {task.title}
                          </div>
                        </div>
                      );
                    })}

                    {dayTasks.length > 2 && (
                      <div
                        className="text-xs text-amber-800 text-center cursor-pointer"
                        onClick={() => {
                          onDateChange(day);
                          // También podrías cambiar la vista a diaria aquí
                        }}
                      >
                        +{dayTasks.length - 2} más
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
