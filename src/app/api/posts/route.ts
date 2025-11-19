// src/app/api/posts/route.ts
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

    const contentType = request.headers.get("content-type") || "";

    const body = await request.json();
    const content = (body.content ?? "").toString();
    const imagesUrls = Array.isArray(body.images) ? body.images : [];

    if (!content.trim()) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await prisma.post.create({
      data: {
        content,
        images: {
          create: imagesUrls.map((url: string) => ({
            imageUrl: url, 
          })),
        }, // empty array if not uploaded yet
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            name: true
          },
        },
        images: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Error creating post" }, { status: 500 });
  }
}
