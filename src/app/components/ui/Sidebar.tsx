// src/app/components/ui/Sidebar.tsx
"use client";

interface SidebarProps {
  view: "daily" | "weekly" | "monthly";
  onViewChange: (view: "daily" | "weekly" | "monthly") => void;
}

export default function Sidebar({ view, onViewChange }: SidebarProps) {
  return (
    <div className="w-24 bg-amber-900 shadow-md flex flex-col items-center p-4 book-cover">
      <div className="w-full text-center mt-6 mb-10">
        <h2 className="text-white font-bold text-lg">
          MI
          <br />
          LIBRO
        </h2>
      </div>

      <button
        onClick={() => onViewChange("daily")}
        className={`w-full py-3 mb-8 text-center text-white rounded ${
          view === "daily"
            ? "bg-amber-800 shadow-inner"
            : "hover:bg-amber-800/50"
        }`}
      >
        <div>Diario</div>
      </button>

      <button
        onClick={() => onViewChange("weekly")}
        className={`w-full py-3 mb-8 text-center text-white rounded ${
          view === "weekly"
            ? "bg-amber-800 shadow-inner"
            : "hover:bg-amber-800/50"
        }`}
      >
        <div>Semanal</div>
      </button>

      <button
        onClick={() => onViewChange("monthly")}
        className={`w-full py-3 mb-8 text-center text-white rounded ${
          view === "monthly"
            ? "bg-amber-800 shadow-inner"
            : "hover:bg-amber-800/50"
        }`}
      >
        <div>Mensual</div>
      </button>
    </div>
  );
}
