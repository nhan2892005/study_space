import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'MENTEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get mentee's progress records
    const progressRecords = await prisma.progressRecord.findMany({
      where: { menteeId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Get upcoming events
    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          {
            assignments: {
              some: { userId: session.user.id }
            }
          }
        ],
        startTime: {
          gte: new Date()
        }
      },
      include: {
        assignments: true
      },
      orderBy: { startTime: 'asc' },
      take: 10
    });

    // Get recent feedback
    const recentFeedback = await prisma.mentorFeedback.findMany({
      where: { menteeId: session.user.id },
      include: {
        mentor: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calculate progress data
    const categoryScores = progressRecords.reduce((acc:any, record:any) => {
      if (!acc[record.category] || acc[record.category].createdAt < record.createdAt) {
        acc[record.category] = record;
      }
      return acc;
    }, {} as Record<string, any>);

    const progressData = Object.entries(categoryScores).map(([category, record]:[any, any]) => {
      // Get previous score for comparison
      const previousRecords = progressRecords.filter((r:any) => 
        r.category === category && r.createdAt < record.createdAt
      );
      const previousScore = previousRecords[0]?.score || 0;

      return {
        category: category.replace('_', ' ').replace(/\b\w/g, (l:any) => l.toUpperCase()),
        currentScore: record.score,
        previousScore,
        target: record.maxScore || 100,
        color: getCategoryColor(category)
      };
    });

    const formattedEvents = events.map((event:any) => ({
      id: event.id,
      title: event.title,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      type: event.type,
      priority: event.priority,
      isCompleted: event.isCompleted
    }));

    const formattedFeedback = recentFeedback.map((feedback:any) => ({
      id: feedback.id,
      category: 'General', // You might want to add category to MentorFeedback model
      score: feedback.score || 0,
      comment: feedback.comment || '',
      date: feedback.createdAt.toISOString().split('T')[0],
      mentorName: feedback.mentor.name || 'Unknown'
    }));

    return NextResponse.json({
      progressData,
      events: formattedEvents,
      recentFeedback: formattedFeedback
    });
  } catch (error) {
    console.error('Mentee dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    coding: '#3B82F6',
    communication: '#10B981',
    project_management: '#F59E0B',
    problem_solving: '#8B5CF6',
    teamwork: '#EF4444'
  };
  return colors[category] || '#6B7280';
}