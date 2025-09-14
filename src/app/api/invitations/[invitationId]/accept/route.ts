// src/app/api/invitations/[invitationId]/accept/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { io } from "@/server/socket-server";

export async function POST(
  request: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = params;

    // Get the invitation
    const invitation = await prisma.serverInvitation.findUnique({
      where: { id: invitationId },
      include: {
        server: true,
        invitedUser: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify the invitation is for this user
    if (invitation.invitedUser.email !== session.user.email) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation has already been processed" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.serverMember.findFirst({
      where: {
        serverId: invitation.server.id,
        userId: invitation.invitedUser.id,
      },
    });

    if (existingMember) {
      // Update invitation status even if already a member
      await prisma.serverInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      });

      return NextResponse.json(
        { error: "You are already a member of this server" },
        { status: 400 }
      );
    }

    // Accept invitation and create membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.serverInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      });

      // Create server membership
      const membership = await tx.serverMember.create({
        data: {
          serverId: invitation.server.id,
          userId: invitation.invitedUser.id,
          role: "MEMBER",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          server: {
            include: {
              channels: true,
            },
          },
        },
      });

      return membership;
    });

    // Emit socket event for the new member joining
    if (io) {
      io.emit('member-joined', {
        serverId: invitation.server.id,
        userId: invitation.invitedUser.id,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          image: result.user.image,
        },
        server: result.server,
      });
    }

    return NextResponse.json({
      message: "Invitation accepted successfully",
      server: result.server,
      membership: {
        id: result.id,
        role: result.role,
        user: result.user,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Error accepting invitation" },
      { status: 500 }
    );
  }
}