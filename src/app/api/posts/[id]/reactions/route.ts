// src/app/api/posts/[id]/reactions/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { Prisma } from "@prisma/client"; // Bỏ import ReactionType

// 1. Tự định nghĩa danh sách các reaction hợp lệ
const VALID_REACTIONS = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];

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
    const type = body?.type; // Kiểu dữ liệu bây giờ là string

    // 2. Sửa lại logic kiểm tra hợp lệ
    if (!type || !VALID_REACTIONS.includes(type)) {
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

    // Các phần logic xử lý bên dưới giữ nguyên...
    const existingReaction = await prisma.reaction.findUnique({
      where: { postId_userId: compoundWhere },
    });

    if (existingReaction) {
      // So sánh chuỗi string bình thường
      if (existingReaction.type === type) {
        await prisma.reaction.delete({
          where: { postId_userId: compoundWhere },
        });
        return NextResponse.json({ message: "Reaction removed" }, { status: 200 });
      }

      const updated = await prisma.reaction.update({
        where: { postId_userId: compoundWhere },
        data: { type },
      });
      return NextResponse.json(updated, { status: 200 });
    }

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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const existingAfterRace = await prisma.reaction.findUnique({
          where: { postId_userId: compoundWhere },
        });

        if (!existingAfterRace) {
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
      throw err;
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
    return NextResponse.json({ error: "Error handling reaction" }, { status: 500 });
  }
}