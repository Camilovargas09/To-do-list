// src/app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (session) {
      // Si el usuario está autenticado, redirigir al dashboard
      router.push("/dashboard");
    } else {
      // Si el usuario no está autenticado, redirigir al login
      router.push("/login");
    }
  }, [session, status, router]);

  // Mientras se verifica la sesión, mostramos un mensaje de cargando
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e0d5c1]">
      <div className="text-xl">Cargando...</div>
    </div>
  );
}
