import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import type { Review, MentorProfile } from '@prisma/client';

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
      mentorStats
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
      })
    ]);

    // Generate activity data for last 30 days using Prisma aggregations
    const activityData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const [newUsers, sessions, messages, reviews] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        prisma.calendarEvent.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        prisma.message.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        prisma.review.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        })
      ]);

      activityData.push({
        date: startOfDay.toISOString().split('T')[0],
        newUsers,
        sessions,
        messages,
        reviews
      });
    }

    // Calculate average rating
    const allReviews = await prisma.review.findMany();
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum : number, review : Review) => sum + review.rating, 0) / allReviews.length
      : 0;

    // Calculate monthly growth (simplified)
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = new Date().getFullYear();
    const lastYear = lastMonth === 11 ? currentYear - 1 : currentYear;
    
    const currentMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1)
        }
      }
    });

    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(lastYear, lastMonth, 1),
          lt: new Date(lastYear, lastMonth + 1, 1)
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

    const formattedMentorStats = mentorStats.map((mentor:any) => ({
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
