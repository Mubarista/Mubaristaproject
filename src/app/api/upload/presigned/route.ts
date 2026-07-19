import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Ensure Videos bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "Videos");
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket("Videos", { public: true });
    }

    const fileExt = filename.split('.').pop() || "mp4";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const path = `learning/${fileName}`;

    const { data, error } = await supabaseAdmin.storage.from("Videos").createSignedUploadUrl(path);
    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage.from("Videos").getPublicUrl(path);

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
