import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get mentor's mentees and their progress
    const mentorConnections = await prisma.menteeConnection.findMany({
      where: {
        mentorId: session.user.id,
        status: 'ACCEPTED'
      },
      include: {
        mentee: {
          include: {
            progressRecords: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    // Calculate mentee statistics
    const menteeStats = mentorConnections.map((connection:any) => {
      const mentee = connection.mentee;
      const progressRecords = mentee.progressRecords;
      
      // Group progress by category and get latest scores
      const categoryScores = progressRecords.reduce((acc:any, record:any) => {
        if (!acc[record.category] || acc[record.category].createdAt < record.createdAt) {
          acc[record.category] = record;
        }
        return acc;
      }, {} as Record<string, any>);

      const categories = {
        coding: categoryScores['coding']?.score || 0,
        communication: categoryScores['communication']?.score || 0,
        project: categoryScores['project_management']?.score || 0,
        problem: categoryScores['problem_solving']?.score || 0,
        teamwork: categoryScores['teamwork']?.score || 0
      };

      const overallScore = Math.round(
        Object.values(categories).reduce((sum, score) => sum + score, 0) / 5
      );

      // Calculate improvement (compare with records from last month)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const oldRecords = progressRecords.filter((r:any) => r.createdAt <= lastMonth);
      const oldCategoryScores = oldRecords.reduce((acc:any, record:any) => {
        if (!acc[record.category] || acc[record.category].createdAt < record.createdAt) {
          acc[record.category] = record;
        }
        return acc;
      }, {} as Record<string, any>);

      const oldOverallScore = Math.round(
        Object.values(oldCategoryScores).reduce((sum: number, record: any) => 
          sum + (record?.score || 0), 0
        ) / 5
      );

      return {
        id: mentee.id,
        name: mentee.name || 'Unknown',
        avatar: mentee.image || '/api/placeholder/40/40',
        overallScore,
        improvement: overallScore - oldOverallScore,
        lastActivity: mentee.updatedAt.toISOString(),
        categories
      };
    });

    // Get mentor profile info
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    });

    return NextResponse.json({
      menteeStats,
      mentorProfile
    });
  } catch (error) {
    console.error('Mentor dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}