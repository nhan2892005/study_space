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

    const mentorId = session.user.id;

    // 1. Count mentees
    const menteeConnections = await prisma.menteeConnection.findMany({
      where: { mentorId, status: 'ACCEPTED' }
    });
    const menteeCount = menteeConnections.length;

    // 2. Count posts created by mentor
    const postCount = await prisma.post.count({
      where: { authorId: mentorId }
    });

    // 3. Count mentees rated (feedback given)
    const ratedMentees = await prisma.mentorFeedback.findMany({
      where: { mentorId },
      distinct: ['menteeId'],
      select: { menteeId: true }
    });
    const ratedMenteeCount = ratedMentees.length;

    // 4. Get mentor reviews and calculate average rating
    const mentorReviews = await prisma.review.findMany({
      where: { mentorId }
    });
    const averageRating = mentorReviews.length > 0
      ? (mentorReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / mentorReviews.length).toFixed(1)
      : 0;

    // 5. Count notifications sent this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    
    const notificationCount = await prisma.notification.count({
      where: {
        createdAt: { gte: thisMonthStart }
      }
    });

    // 6. Count events created this month
    const eventCount = await prisma.calendarEvent.count({
      where: {
        creatorId: mentorId,
        createdAt: { gte: thisMonthStart }
      }
    });

    // 7. Get total feedback given
    const totalFeedbackCount = await prisma.mentorFeedback.count({
      where: { mentorId }
    });

    // 8. Get this week's activity
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyActivity = await prisma.mentorFeedback.count({
      where: {
        mentorId,
        createdAt: { gte: weekAgo }
      }
    });

    // 9. Get mentor profile info
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorId }
    });

    return NextResponse.json({
      menteeCount,
      postCount,
      ratedMenteeCount,
      averageRating: parseFloat(averageRating as string),
      totalReviews: mentorReviews.length,
      notificationsThisMonth: notificationCount,
      eventsThisMonth: eventCount,
      totalFeedback: totalFeedbackCount,
      weeklyActivityCount: weeklyActivity,
      mentorProfile: {
        rating: mentorProfile?.rating || 0,
        totalReviews: mentorProfile?.totalReviews || 0
      }
    });
  } catch (error) {
    console.error('Error fetching mentor overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
