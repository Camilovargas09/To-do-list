// src/app/components/tasks/TaskForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@/app/types/task";

type Priority = "HIGH" | "MEDIUM" | "LOW";

interface TaskFormProps {
  onTaskAdded?: (task: Task) => void;
}

export default function TaskForm({ onTaskAdded }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Asegurarse de que la fecha se mantenga exactamente como el usuario la ingresa
      // sin ningún ajuste de zona horaria
      const dueDateObj = new Date(dueDate + "T00:00:00");

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDateObj.toISOString(), // Convertir a ISO string para la API
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear la tarea");
      }

      // Notificar que se agregó una tarea
      if (onTaskAdded) {
        onTaskAdded(data.task);
      }

      // Limpiar el formulario
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("MEDIUM");

      // Refrescar la página para mostrar la nueva tarea
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocurrió un error al crear la tarea");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
      )}

      <div className="mb-4">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-amber-900"
        >
          Título
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-amber-300 book-input px-3 py-2 focus:border-amber-500 focus:ring-amber-500"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-amber-900"
        >
          Descripción
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-amber-300 book-input px-3 py-2 focus:border-amber-500 focus:ring-amber-500"
          rows={3}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="dueDate"
          className="block text-sm font-medium text-amber-900"
        >
          Fecha de vencimiento
        </label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-amber-300 book-input px-3 py-2 focus:border-amber-500 focus:ring-amber-500"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="priority"
          className="block text-sm font-medium text-amber-900"
        >
          Prioridad
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="mt-1 block w-full rounded-md border border-amber-300 book-input px-3 py-2 focus:border-amber-500 focus:ring-amber-500"
        >
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md book-button px-4 py-2 text-white bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 disabled:opacity-70"
      >
        {loading ? "Añadiendo tarea..." : "Añadir tarea"}
      </button>
    </form>
  );
}
