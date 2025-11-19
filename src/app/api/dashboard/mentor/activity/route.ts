import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const mentorId = session.user.id;
    const searchParams = new URL(request.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent notifications (not specific to creator, but we'll get those related to mentor's actions)
    const recentNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Get events created by this mentor
    const createdEvents = await prisma.calendarEvent.findMany({
      where: { creatorId: mentorId },
      include: {
        assignments: {
          include: { event: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const formattedEvents = createdEvents.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      type: event.type,
      priority: event.priority,
      isCompleted: event.isCompleted,
      assignmentCount: event.assignments.length,
      createdAt: event.createdAt.toISOString()
    }));

    return NextResponse.json({
      notifications: recentNotifications.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString()
      })),
      events: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
