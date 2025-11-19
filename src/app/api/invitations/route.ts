import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
        status: "PENDING",
      },
      include: {
        server: true,
        // SỬA Ở ĐÂY: Dùng 'inviter' thay vì 'invitedBy'
        inviter: {
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
    const formattedInvitations = invitations.map((invitation: any) => ({
      id: invitation.id,
      type: 'SERVER_INVITATION',
      serverId: invitation.serverId,
      serverName: invitation.server.name,
      // SỬA Ở ĐÂY: Lấy name từ 'inviter'
      invitedByName: invitation.inviter.name, 
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