import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { taskId } = params;
    const body = await request.json().catch(() => ({}));
    const { isCompleted } = body;

    if (typeof isCompleted !== 'boolean') {
      return NextResponse.json({ error: 'isCompleted must be boolean' }, { status: 400 });
    }

    // Find the event
    const event = await (prisma as any).calendarEvent.findUnique({
      where: { id: taskId },
      include: { creator: true, assignments: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is creator or assigned to this task
    const isCreator = event.creatorId === session.user.id;
    const isAssigned = event.assignments.some((a: any) => a.userId === session.user.id);

    if (!isCreator && !isAssigned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update completion status
    const updatedEvent = await (prisma as any).calendarEvent.update({
      where: { id: taskId },
      data: { isCompleted },
      include: { creator: true, assignments: true }
    });

    return NextResponse.json({
      message: 'Task updated successfully',
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        isCompleted: updatedEvent.isCompleted,
        startTime: updatedEvent.startTime.toISOString(),
        endTime: updatedEvent.endTime.toISOString(),
        priority: updatedEvent.priority,
        type: updatedEvent.type
      }
    });
  } catch (error) {
    console.error('Task PATCH error:', error);
    return NextResponse.json(
      { error: (error as any)?.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}
