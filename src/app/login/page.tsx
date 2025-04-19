// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../styles/book.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        twoFactorCode: showTwoFactorInput ? twoFactorCode : undefined,
      });

      if (result?.error === "TwoFactorRequired") {
        setShowTwoFactorInput(true);
        setError("");
      } else if (result?.error) {
        setError("Credenciales inválidas");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Ocurrió un error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e0d5c1] p-4">
      <div className="relative w-full max-w-md book-cover p-8">
        <div className="book-binding"></div>

        <h1 className="mb-8 text-center text-3xl font-bold book-title">
          Mi Libro de Tareas
        </h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700 bg-opacity-80">
            {error}
          </div>
        )}

        {!showTwoFactorInput ? (
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-field">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-amber-50 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border book-input px-3 py-2"
                required
              />
            </div>

            <div className="form-field mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-amber-50 mb-1"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border book-input px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md book-button px-4 py-2 text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 disabled:opacity-70"
            >
              {loading ? "Iniciando sesión..." : "Abrir el libro"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-field mb-6">
              <p className="text-amber-50 mb-4">
                Ingresa el código de verificación de tu aplicación de
                autenticación.
              </p>
              <label
                htmlFor="twoFactorCode"
                className="block text-sm font-medium text-amber-50 mb-1"
              >
                Código de verificación
              </label>
              <input
                type="text"
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="mt-1 block w-full rounded-md border book-input px-3 py-2"
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md book-button px-4 py-2 text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 disabled:opacity-70"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-amber-50">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-amber-200 hover:text-white">
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
