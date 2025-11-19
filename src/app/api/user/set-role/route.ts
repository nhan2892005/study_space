import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { role } = body;
  if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 });

  if (!['MENTEE', 'MENTOR', 'ADMIN', 'mentee', 'mentor', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  // Normalize to uppercase enum
  const normalized = role.toString().toUpperCase();

  try {
    const updated = await prisma.user.update({ where: { email: session.user.email }, data: { userType: normalized } });

    if (normalized === 'MENTOR') {
      await prisma.mentorProfile.upsert({ where: { userId: updated.id }, update: {}, create: { userId: updated.id, rating: 0, totalReviews: 0, expertise: [], maxMentees: 5, availableDays: [] } });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Set role error', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
