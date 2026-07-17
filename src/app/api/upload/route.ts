import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "photo";
    const maxWidth = parseInt((formData.get("maxWidth") as string) || "1920");
    const maxHeight = parseInt((formData.get("maxHeight") as string) || "1080");
    const quality = parseInt((formData.get("quality") as string) || "85");
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
      console.error("[Upload] SUPABASE_SECRET_KEY is not set");
      return NextResponse.json({ error: "Server misconfiguration: SUPABASE_SECRET_KEY is missing" }, { status: 500 });
    }

    // Get file extension
    const fileExt = file.name.split('.').pop();
    let fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    let contentType = file.type;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Validate PDF uploads
    if (type === "pdf") {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
      }
      // Optional: limit PDF size to 50MB
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: "PDF must be less than 50MB" }, { status: 400 });
      }
      fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
      contentType = "application/pdf";
    }

    console.log("Upload request:", { type, fileName: file.name, fileType: file.type, fileSize: file.size, maxWidth, maxHeight, quality });

    // Process image if it's an image type
    if (type === "photo" && file.type.startsWith("image/")) {
      try {
        // Resize and optimize image using sharp
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
        // Calculate dimensions to maintain aspect ratio
        let width = maxWidth;
        let height = maxHeight;
        
        if (metadata.width && metadata.height) {
          const aspectRatio = metadata.width / metadata.height;
          
          if (metadata.width > maxWidth) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          }
          
          if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        buffer = await image
          .resize(width, height)
          .jpeg({ quality })
          .toBuffer();
          
        // Update file name and content type for processed images
        fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        contentType = "image/jpeg";
        console.log(`Processed image: ${file.name} -> ${fileName} (${width}x${height})`);
      } catch (error) {
        console.error("Image processing error:", error);
        // Fall back to original buffer if processing fails
      }
    }

    // Upload to Supabase Storage
    const bucketName = type === "pdf" ? "Documents" : "Images"; 
    const { error } = await supabaseAdmin
      .storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Failed to upload image to storage", details: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log("Upload successful:", publicUrl);
    return NextResponse.json({ 
      url: publicUrl,
      fileName,
      bucket: bucketName,
      contentType,
      size: buffer.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
