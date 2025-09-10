import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { InvitationStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pending invitations for the current user
    const invitations = await prisma.serverInvitation.findMany({
      where: {
        invitedUser: { email: session.user.email },
        status: InvitationStatus.PENDING,
      },
      include: {
        server: true,
        invitedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the Notification interface
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      type: 'SERVER_INVITATION',
      serverId: invitation.serverId,
      serverName: invitation.server.name,
      invitedByName: invitation.invitedBy.name,
    }));

    return NextResponse.json({ invitations: formattedInvitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Error fetching invitations" },
      { status: 500 }
    );
  }
}
