import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'MENTEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const currentMonth = new Date();
    currentMonth.setDate(1);

    // Get completed tasks this month
    const completedTasks = await (prisma as any).calendarEvent.count({
      where: {
        OR: [
          { creatorId: userId },
          { assignments: { some: { userId } } }
        ],
        isCompleted: true,
        createdAt: { gte: currentMonth }
      }
    });

    // Get all tasks (created or assigned) this month
    const allTasks = await (prisma as any).calendarEvent.count({
      where: {
        OR: [
          { creatorId: userId },
          { assignments: { some: { userId } } }
        ],
        createdAt: { gte: currentMonth }
      }
    });

    // Get all completed tasks ever (for progress tracking)
    const totalCompletedTasks = await (prisma as any).calendarEvent.count({
      where: {
        OR: [
          { creatorId: userId },
          { assignments: { some: { userId } } }
        ],
        isCompleted: true
      }
    });

    // Get average progress score from progress records
    const progressRecords = await (prisma as any).progressRecord.findMany({
      where: { menteeId: userId },
      select: { score: true }
    });

    const averageScore = progressRecords.length > 0
      ? progressRecords.reduce((sum: any, record: any) => sum + parseFloat(record.score), 0) / progressRecords.length
      : 0;

    // Get this month's average score
    const thisMonthRecords = await (prisma as any).progressRecord.findMany({
      where: {
        menteeId: userId,
        createdAt: { gte: currentMonth }
      },
      select: { score: true }
    });

    const monthlyAverageScore = thisMonthRecords.length > 0
      ? thisMonthRecords.reduce((sum: any, record: any) => sum + parseFloat(record.score), 0) / thisMonthRecords.length
      : 0;

    return NextResponse.json({
      completedTasksThisMonth: completedTasks,
      totalTasksThisMonth: allTasks,
      totalCompletedTasks,
      averageScore: Math.round(averageScore * 10) / 10,
      monthlyAverageScore: Math.round(monthlyAverageScore * 10) / 10,
      completionRate: allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0
    });
  } catch (error) {
    console.error('Mentee stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
