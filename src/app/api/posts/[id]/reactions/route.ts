// src/app/api/posts/[id]/reactions/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { Prisma, ReactionType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const type = body?.type as ReactionType;

    if (!type || !Object.values(ReactionType).includes(type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const compoundWhere = {
      postId: params.id,
      userId: user.id,
    };

    // Fast path: if reaction already exists, do toggle/update
    const existingReaction = await prisma.reaction.findUnique({
      where: { postId_userId: compoundWhere },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // same reaction -> remove (toggle off)
        await prisma.reaction.delete({
          where: { postId_userId: compoundWhere },
        });
        return NextResponse.json({ message: "Reaction removed" }, { status: 200 });
      }

      // different reaction -> update type
      const updated = await prisma.reaction.update({
        where: { postId_userId: compoundWhere },
        data: { type },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // No existing reaction => try to create (may fail with P2002 under race)
    try {
      const created = await prisma.reaction.create({
        data: {
          type,
          postId: params.id,
          userId: user.id,
        },
      });
      return NextResponse.json(created, { status: 201 });
    } catch (err: any) {
      // Handle race condition where another request created the reaction first
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        // re-fetch existing and apply same toggle/update logic
        const existingAfterRace = await prisma.reaction.findUnique({
          where: { postId_userId: compoundWhere },
        });

        if (!existingAfterRace) {
          // unexpected: constraint failed but then not found — return conflict
          return NextResponse.json(
            { error: "Conflict creating reaction" },
            { status: 409 }
          );
        }

        if (existingAfterRace.type === type) {
          await prisma.reaction.delete({
            where: { postId_userId: compoundWhere },
          });
          return NextResponse.json({ message: "Reaction removed" }, { status: 200 });
        } else {
          const updated = await prisma.reaction.update({
            where: { postId_userId: compoundWhere },
            data: { type },
          });
          return NextResponse.json(updated, { status: 200 });
        }
      }

      // unknown prisma error -> rethrow to outer catch
      throw err;
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
    return NextResponse.json({ error: "Error handling reaction" }, { status: 500 });
  }
}
