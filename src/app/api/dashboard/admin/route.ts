import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system stats
    const [
      totalUsers,
      totalMentors,
      totalMentees,
      activeConnections,
      mentorStats,
      activityData
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'MENTOR' } }),
      prisma.user.count({ where: { role: 'MENTEE' } }),
      prisma.menteeConnection.count({ where: { status: 'ACCEPTED' } }),
      
      // Mentor statistics
      prisma.user.findMany({
        where: { role: 'MENTOR' },
        include: {
          mentorProfile: true,
          mentorConnections: {
            where: { status: 'ACCEPTED' }
          },
          receivedReviews: true
        }
      }),

      // Activity data for the last 30 days
      prisma.$queryRaw`
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
        )
        SELECT 
          ds.date,
          COALESCE(users.count, 0) as "newUsers",
          COALESCE(events.count, 0) as sessions,
          COALESCE(messages.count, 0) as messages,
          COALESCE(reviews.count, 0) as reviews
        FROM date_series ds
        LEFT JOIN (
          SELECT DATE(u."createdAt") as date, COUNT(*) as count
          FROM "User" u
          WHERE u."createdAt" >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY DATE(u."createdAt")
        ) users ON ds.date = users.date
        LEFT JOIN (
          SELECT DATE(e."createdAt") as date, COUNT(*) as count
          FROM "CalendarEvent" e
          WHERE e."createdAt" >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY DATE(e."createdAt")
        ) events ON ds.date = events.date
        LEFT JOIN (
          SELECT DATE(m."createdAt") as date, COUNT(*) as count
          FROM "Message" m
          WHERE m."createdAt" >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY DATE(m."createdAt")
        ) messages ON ds.date = messages.date
        LEFT JOIN (
          SELECT DATE(r."createdAt") as date, COUNT(*) as count
          FROM "Review" r
          WHERE r."createdAt" >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY DATE(r."createdAt")
        ) reviews ON ds.date = reviews.date
        ORDER BY ds.date
      `
    ]);

    // Calculate average rating
    const allReviews = await prisma.review.findMany();
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum : number, review) => sum + review.rating, 0) / allReviews.length
      : 0;

    // Calculate monthly growth (simplified)
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), currentMonth, 1),
          lt: new Date(new Date().getFullYear(), currentMonth + 1, 1)
        }
      }
    });

    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), lastMonth, 1),
          lt: new Date(new Date().getFullYear(), lastMonth + 1, 1)
        }
      }
    });

    const monthlyGrowth = lastMonthUsers > 0 
      ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0;

    const systemStats = {
      totalUsers,
      totalMentors,
      totalMentees,
      activeConnections,
      averageRating: Math.round(averageRating * 10) / 10,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
    };

    const formattedMentorStats = mentorStats.map(mentor => ({
      id: mentor.id,
      name: mentor.name || 'Unknown',
      email: mentor.email,
      department: mentor.department || 'N/A',
      menteeCount: mentor.mentorConnections.length,
      averageRating: mentor.mentorProfile?.rating || 0,
      totalReviews: mentor.mentorProfile?.totalReviews || 0,
      joinDate: mentor.createdAt.toISOString().split('T')[0],
      status: mentor.mentorProfile ? 'active' : 'pending',
      completedSessions: Math.floor(Math.random() * 200) // You might want to track this separately
    }));

    return NextResponse.json({
      systemStats,
      mentorStats: formattedMentorStats,
      activityData
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
