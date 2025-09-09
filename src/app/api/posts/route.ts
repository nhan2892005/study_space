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

    // parse body: support application/json or multipart/form-data
    let content = "";
    let imagesUrls: string[] = [];

    if (contentType.includes("application/json")) {
      const body = await request.json();
      content = (body.content ?? "").toString();
      // if you want title, pick from body.title
    } else if (contentType.includes("multipart/form-data")) {
      // request.formData() works in Next.js route handlers
      const formData = await request.formData();
      content = formData.get("content")?.toString() ?? "";

      // get uploaded files (may be File/Blob objects)
      const files = formData.getAll("images") as any[]; // items could be File
      // NOTE: here we do NOT upload files — you should upload to S3/Cloudinary and get URLs
      // For now, we leave imagesUrls empty or implement an uploader here.
      for (const f of files) {
        if (f && typeof f === "object" && typeof (f as any).arrayBuffer === "function") {
          // Example: convert to buffer (if you want to process/upload)
          const arrayBuffer = await (f as any).arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          // TODO: upload `buffer` to cloud storage and push returned URL into imagesUrls
          // imagesUrls.push(uploadedUrl);
        }
      }
    } else {
      // fallback: try json parse (to produce nice error)
      try {
        const body = await request.json();
        content = (body.content ?? "").toString();
      } catch (e) {
        return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
      }
    }

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
        images: imagesUrls, // empty array if not uploaded yet
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Error creating post" }, { status: 500 });
  }
}
