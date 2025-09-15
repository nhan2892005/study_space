import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request, { params }: { params: { mentorId: string } }) {
  const { mentorId } = params;

  const user = await prisma.user.findUnique({
    where: { id: mentorId },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      mentorProfile: true,
    }
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const posts = await prisma.post.findMany({ where: { authorId: mentorId }, orderBy: { createdAt: 'desc' } });
  const reviews = await prisma.review.findMany({ where: { mentorId }, orderBy: { createdAt: 'desc' }, include: { reviewer: { select: { id: true, name: true, image: true } } } });

  return NextResponse.json({ user, posts, reviews });
}

export async function POST(req: Request, { params }: { params: { mentorId: string } }) {
  // mentee sends a request to mentor
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mentorId } = params;
  const body = await req.json().catch(() => ({}));

  try {
    const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
    if (!mentor) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });

    const mentee = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!mentee) return NextResponse.json({ error: 'Mentee not found' }, { status: 404 });

    // create a pending connection request (MenteeConnection with PENDING)
    const existing = await prisma.menteeConnection.findUnique({ where: { menteeId_mentorId: { menteeId: mentee.id, mentorId } } }).catch(() => null);
    if (existing) return NextResponse.json({ error: 'Request already exists' }, { status: 400 });

    const connection = await prisma.menteeConnection.create({ data: { menteeId: mentee.id, mentorId, status: 'PENDING' } });

    // (Optionally) create a ServerInvitation-like notification entry — in this app we will rely on notification polling via invitations API or expand Notification model later. For now the mentor will see pending requests via /api/mentor/requests

    return NextResponse.json({ message: 'Request sent', connection });
  } catch (error: any) {
    console.error('Request error', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
