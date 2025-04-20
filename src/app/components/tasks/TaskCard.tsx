// src/app/components/tasks/TaskCard.tsx
"use client";

import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface TaskProps {
  id: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  dueDate: Date;
  priority: Priority;
  completed: boolean;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onClick?: () => void;
}

export default function TaskCard({
  id,
  title,
  description,
  createdAt,
  dueDate,
  priority,
  completed,
  onDelete,
  onToggleComplete,
  onClick,
}: TaskProps) {
  const [expanded, setExpanded] = useState(false);

  // Calcular los días restantes
  const daysLeft = differenceInDays(new Date(dueDate), new Date());

  // Determinar el color de la prioridad
  const priorityColors = {
    HIGH: "bg-red-500",
    MEDIUM: "bg-green-500",
    LOW: "bg-gray-400",
  };

  const priorityText = {
    HIGH: "Alta",
    MEDIUM: "Media",
    LOW: "Baja",
  };

  // Al hacer clic en la tarjeta
  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else {
      setExpanded(!expanded);
    }
  };

  // Evitar que se propague el clic en botones
  const handleButtonClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation();
    callback();
  };

  return (
    <div
      className={`mb-4 rounded-lg border task-entry ${
        completed ? "bg-amber-50" : "bg-white"
      } cursor-pointer`}
      onClick={handleCardClick}
    >
      <div
        className={`rounded-t-lg px-4 py-3 ${priorityColors[priority]} flex items-center justify-between`}
      >
        <h3
          className={`font-medium text-white ${
            completed ? "line-through" : ""
          }`}
        >
          {title}
        </h3>
        <button
          onClick={(e) => handleButtonClick(e, () => onToggleComplete(id))}
          className="ml-2 rounded-full bg-white/80 p-1 hover:bg-white"
        >
          {completed ? (
            <svg
              className="h-5 w-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-4 border-t">
          {description && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-amber-900">
                Descripción:
              </h4>
              <p className="text-gray-700">{description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-amber-900">Creada:</span>
              <div className="text-gray-700">
                {format(new Date(createdAt), "PPP", { locale: es })}
              </div>
            </div>

            <div>
              <span className="font-medium text-amber-900">Vence:</span>
              <div className="text-gray-700">
                {format(new Date(dueDate), "PPP", { locale: es })}
              </div>
            </div>

            <div>
              <span className="font-medium text-amber-900">Prioridad:</span>
              <div className="text-gray-700">{priorityText[priority]}</div>
            </div>

            <div>
              <span className="font-medium text-amber-900">
                Días restantes:
              </span>
              <div
                className={`${
                  daysLeft < 0
                    ? "text-red-600"
                    : daysLeft === 0
                    ? "text-orange-600"
                    : "text-gray-700"
                }`}
              >
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)} días de retraso`
                  : daysLeft === 0
                  ? "Vence hoy"
                  : `${daysLeft} días`}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => handleButtonClick(e, () => onDelete(id))}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
