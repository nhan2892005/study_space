import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChannelType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await request.json();
    const { serverId } = params;
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Invalid channel data" },
        { status: 400 }
      );
    }

    // Check if user has permission to create channel
    const member = await prisma.serverMember.findFirst({
      where: {
        serverId,
        user: { email: session.user.email },
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Not authorized to create channels" },
        { status: 403 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        server: { connect: { id: serverId } },
      },
      include: {
        server: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Error creating channel:", error);
    return NextResponse.json(
      { error: "Error creating channel" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId } = params;

    // Check if user is member of the server
    const member = await prisma.serverMember.findFirst({
      where: {
        serverId,
        user: { email: session.user.email },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this server" },
        { status: 403 }
      );
    }

    const channels = await prisma.channel.findMany({
      where: { serverId },
      include: {
        _count: {
          select: {
            messages: true,
            recordings: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Error fetching channels" },
      { status: 500 }
    );
  }
}
