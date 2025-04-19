// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, twoFactorEnabled } = await request.json();

    // Validar datos
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    // Cifrar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Si el 2FA está habilitado, obtener el secreto verificado de la cookie
    let twoFactorSecret = null;
    if (twoFactorEnabled) {
      twoFactorSecret = request.cookies.get('verified_2fa_secret')?.value;
      
      if (!twoFactorSecret) {
        return NextResponse.json(
          { message: 'Error de verificación de 2FA. Por favor, configura nuevamente.' },
          { status: 400 }
        );
      }
    }

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        twoFactorEnabled: twoFactorEnabled || false,
        twoFactorSecret: twoFactorSecret,
      },
    });

    // Eliminar el password y secreto 2FA del resultado
    const { password: _, twoFactorSecret: __, ...userWithoutSensitiveInfo } = user;

    // Limpiar cookies
    const response = NextResponse.json(
      { 
        message: 'Usuario registrado correctamente',
        user: userWithoutSensitiveInfo 
      },
      { status: 201 }
    );

    // Eliminar la cookie de secreto verificado
    if (twoFactorEnabled) {
      response.cookies.delete('verified_2fa_secret');
    }

    return response;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}