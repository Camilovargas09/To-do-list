// src/app/api/auth/[...nextauth]/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verifyTOTP } from "@/app/lib/twoFactorAuth";
import { AuthOptions } from "next-auth";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "Código de verificación", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Faltan credenciales");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          console.log("Usuario no encontrado");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          console.log("Contraseña incorrecta");
          return null;
        }

        // Si el 2FA está habilitado para el usuario
        if (user.twoFactorEnabled) {
          // Si no hay código de verificación, solicitar uno
          if (!credentials.twoFactorCode) {
            console.log("Se requiere código 2FA");
            throw new Error("TwoFactorRequired");
          }

          // Si hay un código de verificación, verificarlo
          if (!user.twoFactorSecret) {
            console.log("No hay secreto 2FA configurado");
            throw new Error("TwoFactorNotSetup");
          }

          const isValidToken = verifyTOTP(credentials.twoFactorCode, user.twoFactorSecret);
          if (!isValidToken) {
            console.log("Código 2FA inválido");
            throw new Error("InvalidTwoFactorCode");
          }
          
          console.log("Código 2FA válido");
        } else {
          // Si 2FA no está habilitado, pero el usuario debe configurarlo
          if (user.requiresTwoFactor) {
            console.log("Usuario debe configurar 2FA");
            throw new Error("TwoFactorSetupRequired");
          }
        }

        console.log("Autenticación exitosa");
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          requiresTwoFactor: user.requiresTwoFactor || false
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.requiresTwoFactor = user.requiresTwoFactor;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.requiresTwoFactor = token.requiresTwoFactor as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};