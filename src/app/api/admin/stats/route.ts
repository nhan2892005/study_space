import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Count all users by role
    const [adminCount, mentorCount, menteeCount] = await Promise.all([
      prisma.user.count({ where: { userType: 'ADMIN' } }),
      prisma.user.count({ where: { userType: 'MENTOR' } }),
      prisma.user.count({ where: { userType: 'MENTEE' } })
    ]);

    // 2. Count connections by status
    const [acceptedConnections, pendingConnections, rejectedConnections, totalConnections] = await Promise.all([
      prisma.menteeConnection.count({ where: { status: 'ACCEPTED' } }),
      prisma.menteeConnection.count({ where: { status: 'PENDING' } }),
      prisma.menteeConnection.count({ where: { status: 'REJECTED' } }),
      prisma.menteeConnection.count()
    ]);

    // 3. Get mentor statistics
    const mentorsWithStats = await prisma.mentorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            _count: {
              select: { menteeConnections: true }
            }
          }
        }
      },
      orderBy: { rating: 'desc' },
      take: 10
    });

    const topMentors = mentorsWithStats.map((mp: any) => ({
      id: mp.user.id,
      name: mp.user.name,
      email: mp.user.email,
      department: mp.user.department,
      rating: parseFloat(mp.rating.toString()),
      totalReviews: mp.totalReviews,
      menteeCount: mp.user._count.menteeConnections
    }));

    // 4. Get activity stats (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [newUsers, newConnections, totalPosts, totalFeedback] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.menteeConnection.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.post.count(),
      prisma.mentorFeedback.count()
    ]);

    // 5. Get progress records statistics
    const progressStats = await prisma.progressRecord.aggregate({
      _avg: { score: true },
      _count: { id: true }
    });

    // 6. Department distribution
    const departmentStats = await prisma.user.groupBy({
      by: ['department'],
      _count: { id: true }
    });

    // 7. Connection metrics
    const avgMenteePerMentor = mentorCount > 0 ? (acceptedConnections / mentorCount).toFixed(2) : 0;

    return NextResponse.json({
      userStats: {
        totalAdmins: adminCount,
        totalMentors: mentorCount,
        totalMentees: menteeCount,
        totalUsers: adminCount + mentorCount + menteeCount
      },
      connectionStats: {
        totalConnections,
        acceptedConnections,
        pendingConnections,
        rejectedConnections,
        acceptanceRate: totalConnections > 0 ? ((acceptedConnections / totalConnections) * 100).toFixed(1) : 0,
        avgMenteePerMentor
      },
      activityStats: {
        newUsersLast30Days: newUsers,
        newConnectionsLast30Days: newConnections,
        totalPosts,
        totalFeedback
      },
      progressStats: {
        averageScore: progressStats._avg.score ? parseFloat(progressStats._avg.score.toString()).toFixed(2) : 0,
        totalProgressRecords: progressStats._count.id
      },
      topMentors,
      departmentDistribution: departmentStats.map((d: any) => ({
        department: d.department || 'Unknown',
        count: d._count.id
      }))
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
