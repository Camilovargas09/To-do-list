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

    // Verificar si el usuario ya tiene 2FA habilitado
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { requiresTwoFactor: false },
        { status: 200 }
      );
    }

    // Verificar si es el primer inicio de sesión (usando la fecha de creación)
    const now = new Date();
    const accountAge = now.getTime() - user.createdAt.getTime();
    
    // Si la cuenta tiene menos de 1 hora y no tiene 2FA, consideramos que es el primer login
    const isFirstLogin = accountAge < 60 * 60 * 1000; // 1 hora en milisegundos
    
    // También podemos usar la bandera requiresTwoFactor
    const needsSetup = isFirstLogin || user.requiresTwoFactor;

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