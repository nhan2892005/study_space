import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, image } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Server name is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create server with default channels
    const server = await prisma.chatServer.create({
      data: {
        name,
        description,
        image,
        owner: { connect: { id: user.id } },
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
        channels: {
          createMany: {
            data: [
              { name: 'general', type: 'TEXT', description: 'General discussion' },
              { name: 'announcements', type: 'TEXT', description: 'Important announcements' },
              { name: 'voice-chat', type: 'VOICE', description: 'Voice chat room' },
              { name: 'recordings', type: 'VIDEO', description: 'Recorded sessions' },
            ],
          },
        },
      },
      include: {
        channels: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.error("Error creating server:", error);
    return NextResponse.json(
      { error: "Error creating server" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const servers = await prisma.chatServer.findMany({
      where: {
        members: {
          some: {
            user: {
              email: session.user.email,
            },
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        channels: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(servers);
  } catch (error) {
    console.error("Error fetching servers:", error);
    return NextResponse.json(
      { error: "Error fetching servers" },
      { status: 500 }
    );
  }
}
