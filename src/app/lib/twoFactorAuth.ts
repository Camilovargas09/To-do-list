// src/app/lib/twoFactorAuth.ts
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configuración de TOTP
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

export const generateTOTPSecret = () => {
  return authenticator.generateSecret();
};

export const verifyTOTP = (token: string, secret: string) => {
  return authenticator.verify({ token, secret });
};

export const generateQRCode = async (email: string, secret: string) => {
  const serviceName = 'TodoList Book';
  const otpauth = authenticator.keyuri(email, serviceName, secret);
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};