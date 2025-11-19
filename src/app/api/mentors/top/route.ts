import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Return top 10 mentors by rating (from MentorProfile.rating) then by totalReviews
    const mentors = await prisma.mentorProfile.findMany({
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' }
      ],
      take: 10,
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            department: true,
            major: true
          }
        },
        chuyenMon: true,
        lichTrong: {
          where: {
            ngay: {
              gte: new Date()
            }
          },
          take: 5,
          orderBy: {
            ngay: 'asc'
          }
        }
      }
    });

    // Add generated avatar
    const formattedMentors = mentors.map(mentor => ({
      ...mentor,
      user: {
        ...mentor.user,
        image: `https://api.dicebear.com/9.x/initials/svg?seed=${mentor.user.name}`
      }
    }));

    return NextResponse.json({ mentors: formattedMentors });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(
      { error: 'Error fetching mentors' },
      { status: 500 }
    );
  }
}
