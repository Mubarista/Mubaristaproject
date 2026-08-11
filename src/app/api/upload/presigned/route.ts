import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { filename, contentType, bucket, folder } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const targetBucket = bucket || "Videos";
    const targetFolder = folder !== undefined && folder !== null ? folder : "learning";

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === targetBucket);
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(targetBucket, { public: true });
    }

    const fileExt = filename.split('.').pop() || "mp4";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const path = targetFolder ? `${targetFolder}/${fileName}` : fileName;

    const { data, error } = await supabaseAdmin.storage.from(targetBucket).createSignedUploadUrl(path);
    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage.from(targetBucket).getPublicUrl(path);

    return NextResponse.json({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl,
    });
  } catch (error) {
    console.error("Presigned upload error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
