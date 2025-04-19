// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extender la interfaz de Session por defecto
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      requiresTwoFactor?: boolean;
    };
  }

  /**
   * Extender User para el flujo JWT
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    requiresTwoFactor?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Extender JWT para incluir propiedades personalizadas */
  interface JWT {
    id: string;
    requiresTwoFactor?: boolean;
  }
}