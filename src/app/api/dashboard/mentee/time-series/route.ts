import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'MENTEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get progress records for last 7 months (for time series)
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const progressRecords = await prisma.progressRecord.findMany({
      where: {
        menteeId: session.user.id,
        createdAt: {
          gte: sevenMonthsAgo
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month and category
    const monthlyData: Record<string, any> = {};
    
    progressRecords.forEach((record: any) => {
      const date = new Date(record.createdAt);
      const monthKey = `T${date.getMonth() + 1}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey };
      }
      
      const categoryKey = record.category.toLowerCase().replace(/_/g, '');
      monthlyData[monthKey][categoryKey] = Math.round(record.score);
    });

    // Convert to array and fill in any missing months
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const timeSeriesData = months.map(month => {
      const existing = Object.values(monthlyData).find((d: any) => d.month === month);
      return existing || {
        month,
        coding: 0,
        communication: 0,
        project: 0,
        problem: 0,
        teamwork: 0
      };
    });

    return NextResponse.json({ timeSeriesData });
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
