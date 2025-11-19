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
          select: {
            id: true,
            name: true,
            email: true,
            updatedAt: true,
            progressRecords: {
              orderBy: { createdAt: 'desc' },
              take: 50
            }
          }
        }
      },
      orderBy: { mentee: { name: 'asc' } }
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

      // Calculate improvement: oldest vs newest score
      const sortedByDate = [...progressRecords].sort((a:any, b:any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      let oldOverallScore = 0;
      if (sortedByDate.length > 0) {
        const oldestRecord = sortedByDate[0];
        const oldCategoryScores = sortedByDate
          .filter((r:any) => r.createdAt <= oldestRecord.createdAt)
          .reduce((acc:any, record:any) => {
            if (!acc[record.category]) {
              acc[record.category] = record;
            }
            return acc;
          }, {} as Record<string, any>);
        
        oldOverallScore = Object.keys(oldCategoryScores).length > 0 ? Math.round(
          Object.values(oldCategoryScores).reduce((sum: number, record: any) => 
            sum + (record?.score || 0), 0
          ) / Object.keys(oldCategoryScores).length
        ) : 0;
      }

      return {
        id: mentee.id,
        name: mentee.name || 'Unknown',
        avatar: mentee.image || `https://api.dicebear.com/9.x/avataaars/png?seed=${mentee.id}`,
        email: mentee.email,
        overallScore,
        improvement: overallScore - oldOverallScore,
        lastActivity: mentee.updatedAt.toISOString(),
        categories,
        progressRecordCount: progressRecords.length
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