import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const allowedFields = ['name', 'department', 'major', 'year', 'bio', 'achievements'];
  const data: any = {};
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      data[key] = body[key];
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        department: true,
        major: true,
        //year: true,
        //bio: true,
        //achievements: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Profile update error', error);
    return NextResponse.json({ error: error?.message || 'Failed to update' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      userType: true,
      department: true,
      major: true,
      //year: true,
      //bio: true,
      //achievements: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(user);
}
