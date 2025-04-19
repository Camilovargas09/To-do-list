// src/app/setup-2fa/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import "../styles/book.css";

export default function SetupTwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email/password (si es necesario), 2: configurar 2FA

  useEffect(() => {
    // Obtener el email de los parámetros de la URL
    const emailParam = searchParams?.get("email");
    if (emailParam) {
      setEmail(emailParam);
      // Si ya tenemos el email, podemos pasar directamente a verificar credenciales
      if (session?.user) {
        // Si el usuario ya está autenticado, iniciar la configuración de 2FA
        handleVerifyCredentials();
      }
    }
  }, [searchParams, session]);

  const handleVerifyCredentials = async () => {
    if (!email || (!session && !password)) {
      setError("Por favor, proporciona tu email y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Si no hay sesión, verificar credenciales primero
      if (!session) {
        const response = await fetch("/api/verify-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Error al verificar credenciales");
        }
      }

      // Iniciar configuración de 2FA
      const setupResponse = await fetch("/api/setup-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const setupData = await setupResponse.json();
      if (!setupResponse.ok) {
        throw new Error(setupData.message || "Error al configurar 2FA");
      }

      setQrCodeUrl(setupData.qrCodeUrl);
      setStep(2);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verificar el código 2FA
      const verifyResponse = await fetch("/api/verify-and-enable-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token: twoFactorCode,
        }),
      });

      // Intentar obtener JSON de respuesta
      let verifyData;
      try {
        verifyData = await verifyResponse.json();
      } catch (e) {
        console.error("Error al procesar JSON:", e);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData.message || "Código de verificación inválido"
        );
      }

      // Redirigir al dashboard o al login según corresponda
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/login?success=2fa-enabled");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocurrió un error durante la verificación");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e0d5c1] p-4">
      <div className="relative w-full max-w-md book-cover p-8">
        <div className="book-binding" style={{ width: "10px" }}></div>

        <h1 className="mb-6 text-center text-3xl font-bold book-title">
          Configurar Autenticación
        </h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700 bg-opacity-80">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div style={{ marginLeft: "20px", width: "calc(100% - 30px)" }}>
            {/* Mostrar campos solo si no hay sesión, de lo contrario mostrar un mensaje más relevante */}
            {!session ? (
              <>
                <div className="mb-4">
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
                    style={{ paddingLeft: "12px" }}
                    required
                  />
                </div>

                <div className="mb-6">
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
                    style={{ paddingLeft: "12px" }}
                    required
                  />
                </div>
              </>
            ) : (
              <p className="text-amber-50 mb-4" style={{ marginLeft: "20px" }}>
                Preparando configuración de autenticación de dos factores...
              </p>
            )}

            <button
              onClick={handleVerifyCredentials}
              disabled={loading}
              className="w-full rounded-md book-button px-4 py-2 text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 disabled:opacity-70"
            >
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleVerifyAndEnable}
            style={{ marginLeft: "20px", width: "calc(100% - 30px)" }}
          >
            <div className="mb-4 text-center">
              <p className="text-amber-50 mb-4">
                Escanea este código QR con tu aplicación de autenticación
                (Google Authenticator, Microsoft Authenticator, etc.)
              </p>

              {qrCodeUrl && (
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-2 rounded">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label
                  htmlFor="twoFactorCode"
                  className="block text-sm font-medium text-amber-50 mb-1"
                >
                  Ingresa el código de 6 dígitos
                </label>
                <input
                  type="text"
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border book-input px-3 py-2"
                  style={{ paddingLeft: "12px" }}
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md book-button px-4 py-2 text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 disabled:opacity-70"
            >
              {loading
                ? "Verificando..."
                : "Activar autenticación de dos factores"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
