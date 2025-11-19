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
        image: image || null,
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
              { name: 'welcome', description: 'General discussion' },
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
                // image: true, // Removed
                userType: true, // Mapped
              },
            },
          },
        },
      },
    });
    
    const formattedServer = {
      ...server,
      members: server.members.map(member => ({
        ...member,
        user: {
          ...member.user,
          role: member.user.userType,
          image: `https://api.dicebear.com/9.x/initials/svg?seed=${member.user.name}`
        }
      }))
    };

    return NextResponse.json(formattedServer);
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
        OR: [
          // Servers where user is a member
          {
            members: {
              some: {
                user: {
                  email: session.user.email,
                },
              },
            },
          },
          // Servers where user is the owner
          {
            owner: {
              email: session.user.email,
            },
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
          },
        },
        channels: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const formattedServers = servers.map(server => ({
      ...server,
      owner: {
        ...server.owner,
        image: `https://api.dicebear.com/9.x/initials/svg?seed=${server.owner.name}`
      },
      members: server.members.map(member => ({
        ...member,
        user: {
          ...member.user,
          role: member.user.userType,
          image: `https://api.dicebear.com/9.x/initials/svg?seed=${member.user.name}`
        }
      }))
    }));

    return NextResponse.json(formattedServers);
  } catch (error) {
    console.error("Error fetching servers:", error);
    return NextResponse.json(
      { error: "Error fetching servers" },
      { status: 500 }
    );
  }
}