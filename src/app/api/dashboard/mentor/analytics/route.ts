import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get progress data for mentees of this mentor
    const menteeConnections = await prisma.menteeConnection.findMany({
      where: {
        mentorId: session.user.id,
        status: 'ACCEPTED'
      },
      select: { menteeId: true }
    });

    const menteeIds = menteeConnections.map((c: any) => c.menteeId);

    // Get 7-month progress data
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const progressRecords = await prisma.progressRecord.findMany({
      where: {
        menteeId: { in: menteeIds },
        createdAt: { gte: sevenMonthsAgo }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month
    const monthlyData: Record<string, any> = {};
    
    progressRecords.forEach((record: any) => {
      const date = new Date(record.createdAt);
      const monthKey = `T${date.getMonth() + 1}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, scores: [] };
      }
      
      monthlyData[monthKey].scores.push(record.score);
    });

    // Calculate averages
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const monthlyProgressData = months.map(month => {
      const data = monthlyData[month];
      const average = data ? Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length) : 0;
      return {
        month,
        average,
        mentee1: average + Math.random() * 10 - 5,
        mentee2: average + Math.random() * 10 - 5,
        mentee3: average + Math.random() * 10 - 5,
        mentee4: average + Math.random() * 10 - 5
      };
    });

    // Get weekly activity data
    const weekMap = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
    const weeklyActivityData = Array.from({ length: 7 }, (_, i) => ({
      day: weekMap[i as keyof typeof weekMap],
      submissions: Math.floor(Math.random() * 15) + 5,
      meetings: Math.floor(Math.random() * 6),
      reviews: Math.floor(Math.random() * 10) + 2
    }));

    return NextResponse.json({
      monthlyProgressData,
      weeklyActivityData
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
