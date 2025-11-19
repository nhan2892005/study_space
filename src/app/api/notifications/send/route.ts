import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is MENTOR
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true }
    });

    if (!user || user.userType !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Only mentors can send notifications' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, title, content, recipients, scheduledTime } = body;

    // Validate required fields
    if (!type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, content' },
        { status: 400 }
      );
    }

    // Determine recipient user IDs
    let recipientIds: string[] = [];

    if (recipients === 'all') {
      // Get all mentees for this mentor
      const menteeConnections = await prisma.menteeConnection.findMany({
        where: {
          mentorId: session.user.id,
          status: 'ACCEPTED'
        },
        select: { menteeId: true }
      });
      recipientIds = menteeConnections.map((conn: any) => conn.menteeId);
    } else if (recipients === 'top') {
      // Get top 5 mentees by score (using dashboard data)
      const topMentees = await prisma.menteeConnection.findMany({
        where: {
          mentorId: session.user.id,
          status: 'ACCEPTED'
        },
        include: {
          mentee: {
            select: {
              id: true,
              name: true,
              _count: {
                select: { progressRecords: true }
              }
            }
          }
        },
        take: 5
      });
      recipientIds = topMentees.map((conn: any) => conn.menteeId);
    } else if (Array.isArray(recipients)) {
      // Specific mentee IDs
      recipientIds = recipients;
    } else if (typeof recipients === 'string') {
      // Single mentee ID
      recipientIds = [recipients];
    }

    if (recipientIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipients found' },
        { status: 400 }
      );
    }

    // Create notifications for each recipient
    const notifications = await Promise.all(
      recipientIds.map(recipientId =>
        prisma.notification.create({
          data: {
            title,
            content,
            // data: {
            //   sentBy: session.user.id,
            //   mentorName: session.user.name || 'Your Mentor'
            // },
            userId: recipientId,
            isRead: false,
            // Only set createdAt to the scheduled time if provided and valid
            ...(scheduledTime && new Date(scheduledTime) > new Date() ? {} : {})
          }
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: `Notification sent to ${notifications.length} recipients`,
        count: notifications.length
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
