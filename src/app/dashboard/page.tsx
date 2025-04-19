// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  isToday,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import "../styles/book.css";
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";
import { Task } from "@/app/types/task";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Verificar si el usuario necesita configurar 2FA
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Si el usuario requiere configurar 2FA, redirigir a la página de configuración
      if (session.user.requiresTwoFactor) {
        router.push(
          `/setup-2fa?email=${encodeURIComponent(session.user.email || "")}`
        );
      } else {
        // Si es la primera vez que inicia sesión, marcar que debe configurar 2FA
        const checkFirstLogin = async () => {
          try {
            const response = await fetch("/api/check-first-login");
            const data = await response.json();

            if (data.requiresTwoFactor) {
              // Actualizar el estado del usuario para requerir 2FA en el próximo inicio de sesión
              await fetch("/api/update-requires-2fa", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              });

              // Redirigir a la página de configuración de 2FA
              router.push(
                `/setup-2fa?email=${encodeURIComponent(
                  session.user.email || ""
                )}`
              );
            }
          } catch (error) {
            console.error("Error al verificar primer inicio de sesión:", error);
          }
        };

        checkFirstLogin();
      }
    }
  }, [session, status, router]);

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

    if (session && !session.user.requiresTwoFactor) {
      fetchTasks();
    }
  }, [session]);

  // Filtrar tareas según la vista
  const getFilteredTasks = () => {
    if (!tasks.length) return [];

    if (view === "daily") {
      return tasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return isSameDay(dueDate, selectedDate);
      });
    } else if (view === "weekly") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return tasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= start && dueDate <= end;
      });
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return tasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= start && dueDate <= end;
      });
    }
  };

  // Renderizar la vista de calendario semanal
  const renderWeeklyCalendar = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.toString()}
            className={`text-center p-2 cursor-pointer ${
              isToday(day) ? "bg-amber-100 font-bold" : "hover:bg-amber-50"
            }`}
            onClick={() => {
              setSelectedDate(day);
              setView("daily");
            }}
          >
            <div className="text-sm font-medium">
              {format(day, "EEE", { locale: es })}
            </div>
            <div>{format(day, "d")}</div>
            <div className="h-1 mt-1">
              {tasks.some((task) => isSameDay(new Date(task.dueDate), day)) && (
                <div className="w-2 h-2 mx-auto rounded-full bg-amber-800"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar la vista de calendario mensual
  const renderMonthlyCalendar = () => {
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

    return (
      <div>
        <div className="text-center mb-4 font-bold">
          {format(selectedDate, "MMMM yyyy", { locale: es })}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="text-center font-medium text-sm p-1">
              {day}
            </div>
          ))}
          {days.map((day) => (
            <div
              key={day.toString()}
              className={`text-center p-2 cursor-pointer ${
                !isSameMonth(day, monthStart)
                  ? "text-gray-400"
                  : isToday(day)
                  ? "bg-amber-100 font-bold"
                  : "hover:bg-amber-50"
              }`}
              onClick={() => {
                setSelectedDate(day);
                setView("daily");
              }}
            >
              <div>{format(day, "d")}</div>
              <div className="h-1 mt-1">
                {tasks.some((task) =>
                  isSameDay(new Date(task.dueDate), day)
                ) && (
                  <div className="w-2 h-2 mx-auto rounded-full bg-amber-800"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-[#e0d5c1]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="book-page relative overflow-hidden">
          {/* Encabezado de página */}
          <div className="flex items-center justify-between mb-8 border-b border-amber-800 pb-4">
            <h1 className="text-3xl font-bold text-amber-900 font-serif">
              Mi Libro de Tareas
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-amber-800">
                Hola, {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Selector de vista */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={() => setView("daily")}
              className={`px-4 py-2 rounded ${
                view === "daily"
                  ? "bg-amber-800 text-white"
                  : "bg-amber-100 text-amber-900 hover:bg-amber-200"
              }`}
            >
              Diario
            </button>
            <button
              onClick={() => setView("weekly")}
              className={`px-4 py-2 rounded ${
                view === "weekly"
                  ? "bg-amber-800 text-white"
                  : "bg-amber-100 text-amber-900 hover:bg-amber-200"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setView("monthly")}
              className={`px-4 py-2 rounded ${
                view === "monthly"
                  ? "bg-amber-800 text-white"
                  : "bg-amber-100 text-amber-900 hover:bg-amber-200"
              }`}
            >
              Mensual
            </button>
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="rounded-lg bg-white/80 p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-amber-900">
                  {view === "daily"
                    ? `Tareas para el ${format(selectedDate, "dd MMMM yyyy", {
                        locale: es,
                      })}`
                    : view === "weekly"
                    ? "Tareas de esta semana"
                    : "Tareas de este mes"}
                </h2>

                {/* Calendarios */}
                {view === "weekly" && renderWeeklyCalendar()}
                {view === "monthly" && renderMonthlyCalendar()}

                {/* Lista de tareas */}
                <div className="mt-4">
                  {loading ? (
                    <p>Cargando tareas...</p>
                  ) : filteredTasks.length === 0 ? (
                    <p className="text-amber-800">No hay tareas para mostrar</p>
                  ) : (
                    <TaskList
                      tasks={filteredTasks}
                      onTasksChange={(updatedTasks) => {
                        setTasks((prev) => {
                          // Actualizar la lista completa con las tareas actualizadas
                          const updatedIds = updatedTasks.map((t) => t.id);
                          const remainingTasks = prev.filter(
                            (t) => !updatedIds.includes(t.id)
                          );
                          return [...remainingTasks, ...updatedTasks];
                        });
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-lg bg-white/80 p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-amber-900">
                  Nueva tarea
                </h2>
                <TaskForm
                  onTaskAdded={(newTask) => {
                    setTasks((prev) => [...prev, newTask]);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
