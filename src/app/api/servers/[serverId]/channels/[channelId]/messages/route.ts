// src/app/api/servers/[serverId]/channels/[channelId]/messages/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface FileData {
  name: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  size: number;
}

export async function GET(
  request: Request,
  { params }: { params: { serverId: string; channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is member of the server
    const membership = await prisma.serverMember.findFirst({
      where: {
        serverId: params.serverId,
        user: { email: session.user.email },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this server' }, { status: 403 });
    }

    // Fetch messages with files
    const messages = await prisma.message.findMany({
      where: { channelId: params.channelId },
      include: {
        author: {
          select: { name: true },
        },
        files: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 50, // Limit to last 50 messages
    });

    return NextResponse.json(
      messages.map((msg:any) => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        author: {
          name: msg.author.name || 'Unknown User',
          image: msg.author.image || '',
        },
        files: msg.files,
        timestamp: msg.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { serverId: string; channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is member of the server
    const membership = await prisma.serverMember.findFirst({
      where: {
        serverId: params.serverId,
        user: { email: session.user.email },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this server' }, { status: 403 });
    }

    const { content, type = 'TEXT', files = [] }: {
      content: string;
      type?: 'TEXT' | 'FILE' | 'SYSTEM';
      files?: FileData[];
    } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create message with files
    const message = await prisma.message.create({
      data: {
        content,
        type,
        authorId: user.id,
        channelId: params.channelId,
        files: {
          create: files.map(file => ({
            name: file.name,
            url: file.url,
            type: file.type,
            size: file.size,
          })),
        },
      },
      include: {
        author: {
          select: { name: true },
        },
        files: true,
      },
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      type: message.type,
      author: {
        name: message.author.name || 'Unknown User',
        image: message.author.image || '',
      },
      files: message.files,
      timestamp: message.createdAt,
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}