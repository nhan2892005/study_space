import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();
    const { serverId } = params;

    // Check if the inviter is a member of the server
    const inviterMember = await prisma.serverMember.findFirst({
      where: {
        serverId,
        user: { email: session.user.email },
      },
      include: {
        server: true,
      },
    });

    if (!inviterMember) {
      return NextResponse.json(
        { error: "You are not a member of this server" },
        { status: 403 }
      );
    }

    // Check if the invited user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "User not found. They need to sign up first." },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.serverMember.findFirst({
      where: {
        serverId,
        userId: invitedUser.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this server" },
        { status: 400 }
      );
    }

    // Get the inviter's user record
    const inviter = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!inviter) {
      return NextResponse.json(
        { error: "Inviter not found" },
        { status: 404 }
      );
    }

    // Create invitation
    const invitation = await prisma.serverInvitation.create({
      data: {
        server: { connect: { id: serverId } },
        invitedUser: { connect: { id: invitedUser.id } },
        inviter: { connect: { id: inviter.id } },
      },
      include: {
        server: true,
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // No need for socket events anymore as we're using polling

    return NextResponse.json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Error sending invitation" },
      { status: 500 }
    );
  }
}
