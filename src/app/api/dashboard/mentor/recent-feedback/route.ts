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

    // Get recent feedback from this mentor - last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentFeedback = await prisma.mentorFeedback.findMany({
      where: {
        mentorId: session.user.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Get overall statistics
    const allFeedback = await prisma.mentorFeedback.findMany({
      where: {
        mentorId: session.user.id
      },
      select: {
        score: true
      }
    });

    const scores = allFeedback
      .map((f: any) => f.score)
      .filter((score: any): score is number => score !== null);

    const stats = {
      totalFeedback: allFeedback.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length * 10) / 10 : 0,
      highest: scores.length > 0 ? Math.max(...scores) : 0,
      lowest: scores.length > 0 ? Math.min(...scores) : 0,
      last30Days: recentFeedback.length
    };

    return NextResponse.json({
      recentFeedback,
      stats
    });
  } catch (error) {
    console.error('Error fetching recent feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
