// src/app/api/setup-2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateTOTPSecret, generateQRCode } from '@/app/lib/twoFactorAuth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Generar secreto TOTP
    const secret = generateTOTPSecret();
    
    // Generar código QR
    const qrCodeUrl = await generateQRCode(email, secret);

    // Guardar el secreto temporalmente en una sesión o en una tabla temporal
    // Por simplicidad, lo guardamos en un cookie firmada
    const response = NextResponse.json(
      { 
        message: 'Código QR generado exitosamente',
        qrCodeUrl,
      },
      { status: 200 }
    );

    // Guardar el secreto en una cookie segura y con httpOnly
    response.cookies.set({
      name: 'temp_2fa_secret',
      value: secret,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60, // 10 minutos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error al configurar 2FA:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}