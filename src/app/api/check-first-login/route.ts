// src/app/api/check-first-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener el usuario de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si el usuario ya tiene 2FA habilitado, no es necesario configurarlo
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { requiresTwoFactor: false },
        { status: 200 }
      );
    }

    // Si ya se marcó que requiere 2FA, mantener ese estado
    if (user.requiresTwoFactor) {
      return NextResponse.json(
        { requiresTwoFactor: true },
        { status: 200 }
      );
    }

    // Verificar si es el primer inicio de sesión (usando la fecha de creación)
    const now = new Date();
    const accountAge = now.getTime() - user.createdAt.getTime();
    
    // Si la cuenta tiene más de 24 horas y no tiene 2FA, consideramos que NO es el primer login
    // y por lo tanto debe configurar 2FA
    const isFirstLogin = accountAge < 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    
    // Si NO es el primer login y no tiene 2FA habilitado, debe configurarlo
    const needsSetup = !isFirstLogin;

    // Si necesita configurar 2FA, actualizar el estado en la base de datos
    if (needsSetup) {
      await prisma.user.update({
        where: { id: user.id },
        data: { requiresTwoFactor: true }
      });
    }

    return NextResponse.json(
      { requiresTwoFactor: needsSetup },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al verificar primer inicio de sesión:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}