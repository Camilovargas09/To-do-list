// src/app/api/verify-2fa-setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTP } from '@/app/lib/twoFactorAuth';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'El código de verificación es requerido' },
        { status: 400 }
      );
    }

    // Obtener el secreto temporal de la cookie
    const secret = request.cookies.get('temp_2fa_secret')?.value;

    if (!secret) {
      return NextResponse.json(
        { message: 'Error de sesión, por favor intente de nuevo' },
        { status: 400 }
      );
    }

    // Verificar el token
    const isValid = verifyTOTP(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { message: 'Código de verificación inválido' },
        { status: 400 }
      );
    }

    // Token válido, guardar el secreto para usarlo durante el registro
    const response = NextResponse.json(
      { 
        message: 'Verificación exitosa',
        verified: true,
      },
      { status: 200 }
    );

    // Guardamos el secreto verificado en otra cookie para el registro final
    response.cookies.set({
      name: 'verified_2fa_secret',
      value: secret,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60, // 10 minutos
      path: '/',
    });

    // Eliminamos la cookie temporal
    response.cookies.delete('temp_2fa_secret');

    return response;
  } catch (error) {
    console.error('Error al verificar 2FA:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}