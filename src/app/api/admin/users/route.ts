import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - List all users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role'); // Filter by role
    const search = searchParams.get('search'); // Search by name or email

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (role && ['ADMIN', 'MENTOR', 'MENTEE'].includes(role)) {
      where.userType = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          department: true,
          major: true,
          createdAt: true,
          updatedAt: true,
          accountStatus: true,
          mentorProfile: {
            select: { rating: true, totalReviews: true }
          },
          _count: {
            select: { 
              menteeConnections: true,
              mentorConnections: true,
              posts: true,
              progressRecords: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name || 'N/A',
      email: user.email,
      role: user.userType,
      department: user.department || 'N/A',
      status: user.accountStatus || 'Active',
      rating: user.mentorProfile?.rating || 0,
      totalReviews: user.mentorProfile?.totalReviews || 0,
      menteeCount: user._count.menteeConnections,
      mentorCount: user._count.mentorConnections,
      postCount: user._count.posts,
      progressCount: user._count.progressRecords,
      createdAt: user.createdAt.toISOString()
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, role, department, major } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'MENTOR', 'MENTEE'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        userType: role,
        department,
        major,
        accountStatus: 'Active'
      }
    });

    // If mentor, create mentor profile
    if (role === 'MENTOR') {
      await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          rating: 0,
          totalReviews: 0
        }
      });
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.userType
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, name, email, role, department, major, accountStatus } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) {
      if (!['ADMIN', 'MENTOR', 'MENTEE'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.userType = role;
    }
    if (department) updateData.department = department;
    if (major) updateData.major = major;
    if (accountStatus) updateData.accountStatus = accountStatus;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // If changing to mentor role, create mentor profile if not exists
    if (role === 'MENTOR') {
      const existingProfile = await prisma.mentorProfile.findUnique({
        where: { userId }
      });
      if (!existingProfile) {
        await prisma.mentorProfile.create({
          data: {
            userId,
            rating: 0,
            totalReviews: 0
          }
        });
      }
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.userType
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Prevent deleting self
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
