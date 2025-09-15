import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Return top 10 mentors by rating (from MentorProfile.rating) then by totalReviews
  const mentors = await prisma.mentorProfile.findMany({
    orderBy: [
      { rating: 'desc' },
      { totalReviews: 'desc' }
    ],
    take: 10,
    include: {
      user: {
        select: { id: true, name: true, image: true, email: true }
      }
    }
  });

  return NextResponse.json({ mentors });
}
