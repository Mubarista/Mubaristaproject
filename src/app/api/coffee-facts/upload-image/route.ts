import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

const MAX_SIZE = 200 * 1024; // 200KB
const BUCKET = "coffee-facts";

async function ensureBucket() {
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.error("Failed to list storage buckets:", listError);
      return;
    }
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (exists) return;

    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ["image/*"],
    });

    if (createError) {
      console.error("Failed to create storage bucket:", createError);
    }
  } catch (error) {
    console.error("Error ensuring storage bucket:", error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Image must not exceed 200KB (yours is ${(file.size / 1024).toFixed(1)}KB)` },
        { status: 400 }
      );
    }

    await ensureBucket();

    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `facts/${randomUUID()}.${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Failed to upload image:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload image" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Coffee fact image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
