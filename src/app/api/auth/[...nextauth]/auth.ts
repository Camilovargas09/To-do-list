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
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          return null;
        }

        // Verificar 2FA si está habilitado
        if (user.twoFactorEnabled) {
          // Si no hay código de verificación, solicitar uno
          if (!credentials.twoFactorCode) {
            throw new Error("TwoFactorRequired");
          }

          // Verificar el código
          if (!user.twoFactorSecret || !verifyTOTP(credentials.twoFactorCode, user.twoFactorSecret)) {
            throw new Error("InvalidTwoFactorCode");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
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