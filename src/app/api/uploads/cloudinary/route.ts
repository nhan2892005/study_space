import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
  }

  const formData = await request.formData();
  const files = formData.getAll("images") as any[]; // may be File objects
  const uploadedUrls: string[] = [];

  for (const f of files) {
    if (!f || typeof f.arrayBuffer !== "function") continue;
    const buffer = Buffer.from(await f.arrayBuffer());

    // upload via upload_stream
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `posts/${session.user.id}` },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    uploadedUrls.push(uploadResult.secure_url);
  }

  return NextResponse.json({ urls: uploadedUrls });
}