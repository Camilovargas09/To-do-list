// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

const prisma = new PrismaClient();

// GET /api/tasks/[id] - Obtener una tarea específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la tarea pertenezca al usuario
    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Actualizar una tarea
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que la tarea exista y pertenezca al usuario
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    if (existingTask.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    
    // Si hay una fecha en las actualizaciones, asegurarse de que se mantenga correctamente
    let updatedDueDate;
    if (updates.dueDate) {
      updatedDueDate = new Date(updates.dueDate);
    }
    
    // Actualizar la tarea
    const task = await prisma.task.update({
      where: {
        id: params.id,
      },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updatedDueDate && { dueDate: updatedDueDate }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.completed !== undefined && { completed: updates.completed }),
      },
    });

    return NextResponse.json(
      { message: 'Tarea actualizada exitosamente', task },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Eliminar una tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que la tarea exista y pertenezca al usuario
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    if (existingTask.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 403 }
      );
    }

    // Eliminar la tarea
    await prisma.task.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(
      { message: 'Tarea eliminada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}