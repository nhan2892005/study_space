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
    const { title, description, startTime, endTime, priority } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ 
        error: 'Title, startTime, and endTime are required' 
      }, { status: 400 });
    }

    // Validate priority value
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    const eventPriority = validPriorities.includes(priority) ? priority : 'MEDIUM';

    // Create the calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        priority: eventPriority, // String value
        creatorId: session.user.id,
      }
    });

    // Assign the event to the creator
    await prisma.eventAssignment.create({
      data: {
        eventId: event.id,
        userId: session.user.id,
        status: 'ACCEPTED' // String value
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
          select: { id: true, name: true }
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