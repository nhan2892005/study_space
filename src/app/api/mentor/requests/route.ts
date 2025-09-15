import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mentor = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!mentor) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });

  // Find pending connections where mentorId = mentor.id
  const requests = await prisma.menteeConnection.findMany({ where: { mentorId: mentor.id, status: 'PENDING' }, include: { mentee: { select: { id: true, name: true, email: true, image: true } } } });

  return NextResponse.json({ requests });
}
