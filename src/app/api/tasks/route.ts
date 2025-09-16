import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Return tasks either created by or assigned to the current user
    const created = await (prisma as any).calendarEvent.findMany({
      where: { creatorId: session.user.id },
      orderBy: { startTime: 'desc' },
      include: { assignments: true }
    });

    const assigned = await (prisma as any).eventAssignment.findMany({
      where: { userId: session.user.id },
      include: { event: true }
    });

    return NextResponse.json({ created, assigned });
  } catch (error) {
    console.error('Tasks GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { title, description, startTime, endTime, assigneeIds = [], type = 'PERSONAL', priority = 'MEDIUM' } = body;

  // only mentors can create assigned tasks
  if (session.user.role !== 'MENTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!title || !startTime || !endTime) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  try {
    const event = await (prisma as any).calendarEvent.create({
      data: {
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type: (type as any) || 'PERSONAL',
        priority: (priority as any) || 'MEDIUM',
        creator: { connect: { id: session.user.id } },
        assignments: {
          create: assigneeIds.map((id: string) => ({ user: { connect: { id } } }))
        }
      },
      include: { assignments: true }
    });

    return NextResponse.json({ message: 'Task created', event });
  } catch (error) {
    console.error('Tasks POST error', error);
    return NextResponse.json({ error: (error as any)?.message || 'Failed' }, { status: 500 });
  }
}
