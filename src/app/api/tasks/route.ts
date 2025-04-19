// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

const prisma = new PrismaClient();

// GET /api/tasks - Obtener todas las tareas del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Crear una nueva tarea
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const { title, description, dueDate, priority } = await request.json();

    // Validar datos
    if (!title || !dueDate) {
      return NextResponse.json(
        { message: 'Título y fecha de vencimiento son requeridos' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { message: 'Tarea creada exitosamente', task },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}