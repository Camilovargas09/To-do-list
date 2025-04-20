// src/app/components/tasks/TaskList.tsx
"use client";

import { useState } from "react";
import TaskCard from "./TaskCard";
import { Task } from "@/app/types/task";

interface TaskListProps {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  onTaskClick?: (task: Task) => void;
}

export default function TaskList({
  tasks,
  onTasksChange,
  onTaskClick,
}: TaskListProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Actualizar cuando cambian las props
  if (JSON.stringify(tasks) !== JSON.stringify(localTasks)) {
    setLocalTasks(tasks);
  }

  const handleToggleComplete = async (id: string) => {
    try {
      const task = localTasks.find((t) => t.id === id);
      if (!task) return;

      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        const updatedTasks = localTasks.map((t) =>
          t.id === id ? updatedTask.task : t
        );
        setLocalTasks(updatedTasks);

        if (onTasksChange) {
          onTasksChange(updatedTasks);
        }
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedTasks = localTasks.filter((t) => t.id !== id);
        setLocalTasks(updatedTasks);

        if (onTasksChange) {
          onTasksChange(updatedTasks);
        }
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleTaskClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  if (!localTasks.length) {
    return (
      <div className="text-amber-800 italic py-4 text-center">
        No hay tareas para mostrar. ¡Es momento de añadir una!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {localTasks.map((task) => (
        <TaskCard
          key={task.id}
          id={task.id}
          title={task.title}
          description={task.description}
          createdAt={task.createdAt}
          dueDate={task.dueDate}
          priority={task.priority}
          completed={task.completed}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
          onClick={() => handleTaskClick(task)}
        />
      ))}
    </div>
  );
}
