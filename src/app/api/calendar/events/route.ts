import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startTime, endTime, type, priority, location } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ 
        error: 'Title, startTime, and endTime are required' 
      }, { status: 400 });
    }

    // Create the calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type: type || 'PERSONAL',
        priority: priority || 'MEDIUM',
        location,
        creatorId: session.user.id,
      }
    });

    // Assign the event to the creator
    await prisma.eventAssignment.create({
      data: {
        eventId: event.id,
        userId: session.user.id,
        status: 'ACCEPTED'
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get events created by user or assigned to user
    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          {
            assignments: {
              some: { userId: session.user.id }
            }
          }
        ]
      },
      include: {
        assignments: true,
        creator: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { startTime: 'asc' },
      take: 50
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
