// src/app/api/update-requires-2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Actualizar el estado requiresTwoFactor del usuario
    await prisma.user.update({
      where: { id: session.user.id },
      data: { requiresTwoFactor: true },
    });

    return NextResponse.json(
      { message: 'Estado de 2FA actualizado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar estado de 2FA:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}