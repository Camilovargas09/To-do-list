// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "../styles/book.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enableTwoFactor, setEnableTwoFactor] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: info, 2: 2FA setup (if enabled)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validar contraseñas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      if (step === 1) {
        if (enableTwoFactor) {
          // Si se habilitó 2FA, solicitar la configuración del segundo factor
          const response = await fetch("/api/setup-2fa", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Error al configurar 2FA");
          }

          setQrCodeUrl(data.qrCodeUrl);
          setStep(2);
          setLoading(false);
          return;
        }

        // Registro sin 2FA
        await completeRegistration();
      } else if (step === 2) {
        // Verificar el código 2FA ingresado
        const verifyResponse = await fetch("/api/verify-2fa-setup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            token: twoFactorCode,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(
            verifyData.message || "Código de verificación inválido"
          );
        }

        // Completar el registro con 2FA habilitado
        await completeRegistration(true);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocurrió un error durante el registro");
      }
      setLoading(false);
    }
  };

  const completeRegistration = async (twoFactorEnabled = false) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          twoFactorEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario");
      }

      // Registro exitoso, redirigir a login
      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocurrió un error durante el registro");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e0d5c1] p-4">
      <div className="relative w-full max-w-md book-cover p-8">
        <div className="book-binding"></div>

        <h1 className="mb-6 text-center text-3xl font-bold book-title">
          {step === 1 ? "Registra tu Libro" : "Configura tu Seguridad"}
        </h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700 bg-opacity-80">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-field">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-amber-50 mb-1"
              >
                Nombre
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border book-input px-3 py-2"
                required
              />
            </div>

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

            <div className="form-field">
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

            <div className="form-field">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-amber-50 mb-1"
              >
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border book-input px-3 py-2"
                required
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center text-amber-50">
                <input
                  type="checkbox"
                  checked={enableTwoFactor}
                  onChange={(e) => setEnableTwoFactor(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-amber-800 focus:ring-amber-700"
                />
                Habilitar autenticación de dos factores
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md book-button px-4 py-2 text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 disabled:opacity-70"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="form-container">
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

              <div className="form-field">
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
              {loading ? "Verificando..." : "Completar registro"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-amber-50">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-amber-200 hover:text-white">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
