import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    menteeId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { menteeId } = params;

    // Get feedback history from this mentor to this mentee
    const feedbackHistory = await prisma.mentorFeedback.findMany({
      where: {
        mentorId: session.user.id,
        menteeId: menteeId
      },
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const scores = feedbackHistory
      .map((f: any) => f.score)
      .filter((score: any): score is number => score !== null);

    const stats = {
      totalFeedback: feedbackHistory.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length * 10) / 10 : 0,
      latestScore: scores.length > 0 ? scores[0] : null,
      trend: scores.length >= 2 
        ? (scores[0] - scores[1] > 0 ? 'up' : scores[0] - scores[1] < 0 ? 'down' : 'stable')
        : null
    };

    return NextResponse.json({
      feedbackHistory,
      stats
    });
  } catch (error) {
    console.error('Error fetching feedback history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { menteeId } = params;
    const body = await request.json();
    const { score, comment } = body;

    // Validate score
    if (score !== null && score !== undefined) {
      if (typeof score !== 'number' || score < 0 || score > 10) {
        return NextResponse.json(
          { error: 'Score must be a number between 0 and 10' },
          { status: 400 }
        );
      }
    }

    // Verify mentee is connected to this mentor
    const connection = await prisma.menteeConnection.findUnique({
      where: {
        menteeId_mentorId: {
          menteeId: menteeId,
          mentorId: session.user.id
        }
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'This mentee is not your connection' },
        { status: 403 }
      );
    }

    // Create feedback
    const feedback = await prisma.mentorFeedback.create({
      data: {
        mentorId: session.user.id,
        menteeId: menteeId,
        score: score || null,
        comment: comment || null
      }
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
