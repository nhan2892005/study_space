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

    // Fetch channel information
    const channel = await prisma.channel.findUnique({
      where: {
        id: channelId,
        serverId: serverId
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    return NextResponse.json(channel);

  } catch (error) {
    console.error("[CHANNEL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { serverId: string; channelId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { serverId, channelId } = params;
    const { name, description } = await req.json();

    if (!name || typeof name !== "string") {
      return new NextResponse("Invalid name", { status: 400 });
    }

    // Verify user is admin or owner of server
    const member = await prisma.serverMember.findFirst({
      where: {
        serverId: serverId,
        user: {
          email: session.user.email
        },
        OR: [
          { role: "ADMIN" },
          { role: "OWNER" }
        ]
      }
    });

    if (!member) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Update channel
    const channel = await prisma.channel.update({
      where: {
        id: channelId,
        serverId: serverId
      },
      data: {
        name,
        description
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true
      }
    });

    return NextResponse.json(channel);

  } catch (error) {
    console.error("[CHANNEL_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { serverId: string; channelId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { serverId, channelId } = params;

    // Verify user is admin or owner of server
    const member = await prisma.serverMember.findFirst({
      where: {
        serverId: serverId,
        user: {
          email: session.user.email
        },
        OR: [
          { role: "ADMIN" },
          { role: "OWNER" }
        ]
      }
    });

    if (!member) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete channel
    await prisma.channel.delete({
      where: {
        id: channelId,
        serverId: serverId
      }
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error("[CHANNEL_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
