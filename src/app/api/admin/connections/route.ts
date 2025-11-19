import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - List all connections with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // PENDING, ACCEPTED, REJECTED
    const mentorId = searchParams.get('mentorId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && ['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      where.status = status;
    }
    if (mentorId) {
      where.mentorId = mentorId;
    }

    const [connections, total] = await Promise.all([
      prisma.menteeConnection.findMany({
        where,
        include: {
          mentee: {
            select: { id: true, name: true, email: true, department: true }
          },
          mentor: {
            select: { id: true, name: true, email: true, department: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.menteeConnection.count({ where })
    ]);

    const formattedConnections = connections.map((conn: any) => ({
      id: conn.id,
      menteeId: conn.menteeId,
      menteeName: conn.mentee.name,
      menteeEmail: conn.mentee.email,
      menteeDepart: conn.mentee.department,
      mentorId: conn.mentorId,
      mentorName: conn.mentor.name,
      mentorEmail: conn.mentor.email,
      mentorDepart: conn.mentor.department,
      status: conn.status,
      createdAt: conn.createdAt.toISOString(),
      updatedAt: conn.updatedAt.toISOString()
    }));

    return NextResponse.json({
      connections: formattedConnections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new connection (add mentee to mentor)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { menteeId, mentorId, status = 'ACCEPTED' } = body;

    if (!menteeId || !mentorId) {
      return NextResponse.json(
        { error: 'Missing required fields: menteeId, mentorId' },
        { status: 400 }
      );
    }

    // Verify both users exist
    const [mentee, mentor] = await Promise.all([
      prisma.user.findUnique({ where: { id: menteeId } }),
      prisma.user.findUnique({ where: { id: mentorId } })
    ]);

    if (!mentee || !mentor) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if connection already exists
    const existing = await prisma.menteeConnection.findUnique({
      where: {
        menteeId_mentorId: { menteeId, mentorId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Connection already exists' }, { status: 409 });
    }

    // Create connection
    const connection = await prisma.menteeConnection.create({
      data: {
        menteeId,
        mentorId,
        status: status
      },
      include: {
        mentee: { select: { name: true } },
        mentor: { select: { name: true } }
      }
    });

    return NextResponse.json({
      message: 'Connection created successfully',
      connection: {
        id: connection.id,
        menteeName: connection.mentee.name,
        mentorName: connection.mentor.name,
        status: connection.status
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update connection status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, status } = body;

    if (!connectionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: connectionId, status' },
        { status: 400 }
      );
    }

    if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const connection = await prisma.menteeConnection.update({
      where: { id: connectionId },
      data: { status }
    });

    return NextResponse.json({
      message: 'Connection updated successfully',
      connection: { id: connection.id, status: connection.status }
    });
  } catch (error: any) {
    console.error('Error updating connection:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove connection (delete mentee from mentor)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 });
    }

    await prisma.menteeConnection.delete({ where: { id: connectionId } });

    return NextResponse.json({ message: 'Connection deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
