import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { requestId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action, reason } = body; // action: 'ACCEPT' | 'REJECT'

  const mentor = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!mentor) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });

  try {
    const request = await prisma.menteeConnection.findUnique({ where: { id: params.requestId } });
    if (!request || request.mentorId !== mentor.id) return NextResponse.json({ error: 'Request not found or unauthorized' }, { status: 404 });

    if (action === 'ACCEPT') {
      const updated = await prisma.menteeConnection.update({ where: { id: params.requestId }, data: { status: 'ACCEPTED' } });
      return NextResponse.json({ message: 'Accepted', connection: updated });
    } else {
      const updated = await prisma.menteeConnection.update({ where: { id: params.requestId }, data: { status: 'REJECTED' } });
      // store reason? currently not stored; could expand schema. For now, return reason in response.
      return NextResponse.json({ message: 'Rejected', reason, connection: updated });
    }
  } catch (error: any) {
    console.error('Respond error', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
