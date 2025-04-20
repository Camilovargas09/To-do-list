// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/ui/Sidebar";
import DailyView from "../components/ui/DailyView";
import WeeklyView from "../components/ui/WeeklyView";
import MonthlyView from "../components/ui/MonthlyView";
import TaskForm from "../components/tasks/TaskForm";
import { Task } from "@/app/types/task";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState<"HIGH" | "MEDIUM" | "LOW">(
    "MEDIUM"
  );

  // Redireccionar si no hay sesión
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Cargar tareas
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks");
        const data = await response.json();
        setTasks(data.tasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchTasks();
    }
  }, [session]);

  // Manejador para cuando se selecciona una tarea
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditing(false);
  };

  // Manejador para cerrar el detalle de tarea
  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
    setIsEditing(false);
  };

  // Manejar cambios en las tareas
  const handleTasksChange = (updatedTasks: Task[]) => {
    setTasks((prev) => {
      const updatedIds = updatedTasks.map((t) => t.id);
      const remainingTasks = prev.filter((t) => !updatedIds.includes(t.id));
      return [...remainingTasks, ...updatedTasks];
    });
  };

  // Iniciar edición de tarea
  const handleStartEdit = () => {
    if (!selectedTask) return;

    setEditTitle(selectedTask.title);
    setEditDescription(selectedTask.description || "");
    setEditDueDate(new Date(selectedTask.dueDate).toISOString().split("T")[0]);
    setEditPriority(selectedTask.priority);
    setIsEditing(true);
  };

  // Guardar edición de tarea
  const handleSaveEdit = async () => {
    if (!selectedTask) return;

    try {
      // Crear objeto de fecha con la fecha exacta seleccionada por el usuario
      const dueDateObj = new Date(editDueDate + "T00:00:00");

      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          dueDate: dueDateObj.toISOString(),
          priority: editPriority,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === selectedTask.id ? result.task : t))
        );
        setSelectedTask(result.task);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? result.task : t))
        );

        // Actualizar la tarea seleccionada si es la que se está mostrando
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(result.task);
        }
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        // Cerrar el detalle si es la tarea que se está mostrando
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(null);
        }
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e0d5c1]">
        <div className="text-xl">Abriendo el libro...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#e0d5c1] flex">
      {/* Barra lateral */}
      <Sidebar view={view} onViewChange={setView} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Encabezado */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-amber-900">
            Mi Libro de Tareas
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-amber-800">
              Hola, {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="rounded bg-[#ec7063] px-3 py-1 text-sm text-white hover:bg-red-500"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Área de contenido principal */}
        <div className="flex-1 flex">
          {/* Área de visualización de tareas */}
          <div className="flex-1 book-page overflow-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-amber-800 text-lg">Cargando tareas...</p>
              </div>
            ) : (
              <>
                {view === "daily" && (
                  <DailyView
                    tasks={tasks}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onTasksChange={handleTasksChange}
                    onTaskClick={handleTaskClick}
                  />
                )}

                {view === "weekly" && (
                  <WeeklyView
                    tasks={tasks}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onTaskClick={handleTaskClick}
                  />
                )}

                {view === "monthly" && (
                  <MonthlyView
                    tasks={tasks}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onTaskClick={handleTaskClick}
                  />
                )}
              </>
            )}
          </div>

          {/* Panel lateral para nueva tarea o detalle de tarea seleccionada */}
          <div className="w-96 bg-white p-6 shadow-md">
            {selectedTask ? (
              <div>
                <div className="flex justify-between mb-4">
                  <h2 className="text-xl font-semibold text-amber-900">
                    Detalle de tarea
                  </h2>
                  <button
                    onClick={handleCloseTaskDetail}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                {isEditing ? (
                  // Formulario de edición
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-amber-900 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-amber-900 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2"
                        rows={3}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-amber-900 mb-1">
                        Fecha de vencimiento
                      </label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-amber-900 mb-1">
                        Prioridad
                      </label>
                      <select
                        value={editPriority}
                        onChange={(e) =>
                          setEditPriority(
                            e.target.value as "HIGH" | "MEDIUM" | "LOW"
                          )
                        }
                        className="mt-1 block w-full rounded-md border border-amber-300 px-3 py-2"
                      >
                        <option value="HIGH">Alta</option>
                        <option value="MEDIUM">Media</option>
                        <option value="LOW">Baja</option>
                      </select>
                    </div>

                    <div className="flex space-x-2 mt-6">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                      >
                        Guardar cambios
                      </button>

                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Vista de detalles
                  <div>
                    <div className="mb-4">
                      <h3 className="font-bold text-lg">
                        {selectedTask.title}
                      </h3>
                      <div
                        className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                          selectedTask.priority === "HIGH"
                            ? "bg-red-100 text-red-800"
                            : selectedTask.priority === "MEDIUM"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedTask.priority === "HIGH"
                          ? "Alta"
                          : selectedTask.priority === "MEDIUM"
                          ? "Media"
                          : "Baja"}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-amber-900">
                        Descripción:
                      </h4>
                      <p className="text-gray-700 mt-1">
                        {selectedTask.description || "Sin descripción"}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-amber-900">
                        Fecha de vencimiento:
                      </h4>
                      <p className="text-gray-700 mt-1">
                        {new Date(selectedTask.dueDate).toLocaleDateString(
                          "es-ES",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    <button
                      onClick={handleStartEdit}
                      className="w-full mb-6 px-4 py-2 bg-amber-100 text-amber-800 rounded-md border border-amber-300 hover:bg-amber-200"
                    >
                      Editar tarea
                    </button>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() =>
                          handleToggleTaskComplete(selectedTask.id)
                        }
                        className="flex items-center h-5 justify-center px-2 py-1 bg-[#76d7c4] text-white rounded text-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        {selectedTask.completed
                          ? "Marcar como pendiente"
                          : "Marcar como completada"}
                      </button>

                      <button
                        onClick={() => handleDeleteTask(selectedTask.id)}
                        className="flex items-center h-10 justify-center px-3 py-1 bg-[#ec7063] text-white rounded text-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-amber-900 mb-4">
                  Nueva tarea
                </h2>
                <TaskForm
                  onTaskAdded={(newTask) => {
                    setTasks((prev) => [...prev, newTask]);
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
