import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { mentorId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mentee = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!mentee) return NextResponse.json({ error: 'Mentee not found' }, { status: 404 });

  const { mentorId } = params;
  const body = await req.json().catch(() => ({}));
  const { rating, comment } = body;

  // Check accepted connection
  const conn = await prisma.menteeConnection.findUnique({ where: { menteeId_mentorId: { menteeId: mentee.id, mentorId } } }).catch(() => null);
  if (!conn || conn.status !== 'ACCEPTED') return NextResponse.json({ error: 'Not connected or not accepted' }, { status: 403 });

  try {
    const review = await prisma.review.create({ data: { reviewerId: mentee.id, mentorId, rating: Number(rating), comment } });

    // Update MentorProfile aggregate if exists
    const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: mentorId } });
    if (mentorProfile) {
      const aggregated = await prisma.review.aggregate({ where: { mentorId }, _avg: { rating: true }, _count: { rating: true } });
      await prisma.mentorProfile.update({ where: { userId: mentorId }, data: { rating: aggregated._avg.rating || 0, totalReviews: aggregated._count.rating } });
    }

    return NextResponse.json({ message: 'Review added', review });
  } catch (error: any) {
    console.error('Review error', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
