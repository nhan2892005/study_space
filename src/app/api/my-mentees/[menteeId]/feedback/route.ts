import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { menteeId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mentor = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!mentor) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
  if (mentor.role !== 'MENTOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { menteeId } = params;
  const body = await req.json().catch(() => ({}));
  const { score, comment } = body;

  // ensure there is an accepted connection
  const conn = await prisma.menteeConnection.findUnique({ where: { menteeId_mentorId: { menteeId, mentorId: mentor.id } } }).catch(() => null);
  if (!conn || conn.status !== 'ACCEPTED') return NextResponse.json({ error: 'Not connected or not accepted' }, { status: 403 });

  try {
    const fb = await prisma.mentorFeedback.create({ data: { mentorId: mentor.id, menteeId, score: score ? Number(score) : undefined, comment } });
    return NextResponse.json({ message: 'Feedback saved', feedback: fb });
  } catch (error: any) {
    console.error('Feedback error', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
