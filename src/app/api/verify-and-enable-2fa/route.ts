// src/app/api/verify-and-enable-2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyTOTP } from '@/app/lib/twoFactorAuth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Extraer datos de la solicitud
    let email, token;
    try {
      const body = await request.json();
      email = body.email;
      token = body.token;
      console.log("Datos recibidos:", { email, token });
    } catch (e) {
      console.error("Error al procesar JSON:", e);
      return NextResponse.json(
        { message: 'Error al leer los datos de la solicitud' },
        { status: 400 }
      );
    }

    if (!email || !token) {
      console.log("Faltan datos:", { email, token });
      return NextResponse.json(
        { message: 'Email y código de verificación son requeridos' },
        { status: 400 }
      );
    }

    // Obtener sesión
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("Sesión:", session ? "Presente" : "No presente");
    } catch (e) {
      console.error("Error al obtener sesión:", e);
      // Continuar sin verificar la sesión
    }

    // Obtener el usuario por email
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
      console.log("Usuario encontrado:", user ? "Sí" : "No");
    } catch (e) {
      console.error("Error al buscar usuario:", e);
      return NextResponse.json(
        { message: 'Error al buscar usuario en la base de datos' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (session && session.user && session.user.id !== user.id) {
      console.log("No autorizado:", session.user.id, "!=", user.id);
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener el secreto temporal de la cookie
    const secret = request.cookies.get('temp_2fa_secret')?.value;
    console.log("Secreto en cookie:", secret ? "Presente" : "No presente");

    if (!secret) {
      return NextResponse.json(
        { message: 'Error de sesión, por favor intente de nuevo' },
        { status: 400 }
      );
    }

    // Verificar el token
    let isValid;
    try {
      isValid = verifyTOTP(token, secret);
      console.log("Verificación de token:", isValid ? "Válido" : "Inválido");
    } catch (e) {
      console.error("Error al verificar token:", e);
      return NextResponse.json(
        { message: 'Error al verificar código' },
        { status: 500 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { message: 'Código de verificación inválido' },
        { status: 400 }
      );
    }

    // Token válido, habilitar 2FA para el usuario
    try {
      await prisma.user.update({
        where: { email },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          requiresTwoFactor: false, // Ya no requiere configuración
        },
      });
      console.log("Usuario actualizado con 2FA");
    } catch (e) {
      console.error("Error al actualizar usuario:", e);
      return NextResponse.json(
        { message: 'Error al actualizar la configuración de 2FA' },
        { status: 500 }
      );
    }

    // Crear respuesta exitosa
    const response = NextResponse.json(
      { 
        message: 'Autenticación de dos factores habilitada correctamente',
        success: true,
      },
      { status: 200 }
    );

    // Eliminar la cookie temporal
    response.cookies.delete('temp_2fa_secret');
    console.log("Cookie eliminada, enviando respuesta");

    return response;
  } catch (error) {
    console.error('Error al verificar y habilitar 2FA:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}