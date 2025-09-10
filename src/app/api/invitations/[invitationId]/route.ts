import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { InvitationStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    const { invitationId } = params;

    if (!Object.values(InvitationStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid invitation status" },
        { status: 400 }
      );
    }

    // Get invitation and check if it belongs to the user
    const invitation = await prisma.serverInvitation.findFirst({
      where: {
        id: invitationId,
        invitedUser: { email: session.user.email },
        status: InvitationStatus.PENDING,
      },
      include: {
        server: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Update invitation status
    await prisma.serverInvitation.update({
      where: { id: invitationId },
      data: { status },
    });

    // If accepted, add user to server
    if (status === InvitationStatus.ACCEPTED) {
      await prisma.serverMember.create({
        data: {
          server: { connect: { id: invitation.serverId } },
          user: { connect: { email: session.user.email } },
          role: 'MEMBER',
        },
      });

      // No need for socket notification
    }

    return NextResponse.json({ message: `Invitation ${status.toLowerCase()}` });
  } catch (error) {
    console.error("Error handling invitation:", error);
    return NextResponse.json(
      { error: "Error handling invitation" },
      { status: 500 }
    );
  }
}
