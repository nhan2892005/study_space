import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getFileType = (mimeType: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' => {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENT';
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadResults = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== "function") continue;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileType = getFileType(file.type);
      
      // Determine resource type for Cloudinary
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (fileType === 'IMAGE') resourceType = 'image';
      else if (fileType === 'VIDEO') resourceType = 'video';

      // Upload to Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: `chat/${session.user.id}`,
            resource_type: resourceType,
            // For videos, we might want to generate thumbnails
            ...(fileType === 'VIDEO' && {
              eager: [
                { width: 300, height: 200, crop: "pad", format: "jpg" }
              ]
            })
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      uploadResults.push({
        url: uploadResult.secure_url,
        originalName: file.name,
        type: fileType,
        size: file.size,
        ...(fileType === 'VIDEO' && uploadResult.eager && {
          thumbnail: uploadResult.eager[0]?.secure_url
        })
      });
    }

    return NextResponse.json({ 
      success: true,
      urls: uploadResults.map(r => r.url),
      files: uploadResults
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" }, 
      { status: 500 }
    );
  }
}