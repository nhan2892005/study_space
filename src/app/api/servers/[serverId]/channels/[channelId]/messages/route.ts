import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { serverId: string; channelId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { serverId, channelId } = params;

    // Verify user is member of server
    const member = await prisma.serverMember.findFirst({
      where: {
        serverId: serverId,
        user: {
          email: session.user.email
        }
      }
    });

    if (!member) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch messages with author information and files
    const messages = await prisma.message.findMany({
      where: {
        channelId: channelId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        files: {
          select: {
            id: true,
            name: true,
            url: true,
            type: true,
            size: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 messages
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { serverId: string; channelId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { serverId, channelId } = params;
    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return new NextResponse("Invalid content", { status: 400 });
    }

    // Verify user is member of server
    const member = await prisma.serverMember.findFirst({
      where: {
        serverId: serverId,
        user: {
          email: session.user.email
        }
      }
    });

    if (!member) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        files: true
      }
    });

    return NextResponse.json(message);

  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
