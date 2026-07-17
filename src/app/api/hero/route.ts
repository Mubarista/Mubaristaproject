import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { computePlatformStats } from "@/lib/platform-stats";

export async function GET() {
  try {
    const [computedStats, statsRes, contentRes, bgRes] = await Promise.all([
      computePlatformStats(),
      supabaseAdmin.from("platform_stats").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("hero_content").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("hero_background").select("*").limit(1).maybeSingle(),
    ]);

    const storedStats = statsRes.data ? mapKeysToCamelCase(statsRes.data) : null;

    return NextResponse.json({
      platformStats: storedStats ? { ...storedStats, ...computedStats } : computedStats,
      heroContent: contentRes.data ? mapKeysToCamelCase(contentRes.data) : null,
      heroBackground: bgRes.data ? mapKeysToCamelCase(bgRes.data) : null,
    });
  } catch (error) {
    console.error("Error fetching hero data:", error);
    return NextResponse.json({ platformStats: null, heroContent: null, heroBackground: null });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received hero update request:", JSON.stringify(body, null, 2));

    // Validate request body
    if (!body || typeof body !== 'object') {
      console.error("Invalid request body: not an object");
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Check payload size
    const payloadSize = JSON.stringify(body).length;
    console.log("Request payload size:", payloadSize, "bytes");
    if (payloadSize > 4000000) { // 4MB limit for Vercel
      console.error("Payload too large:", payloadSize);
      return NextResponse.json({ error: "Payload too large. Images/videos must be smaller than 4MB total." }, { status: 413 });
    }

    // Reject base64 data URLs - images/videos must be uploaded to storage first
    const hasBase64 = JSON.stringify(body).includes("data:image/") || JSON.stringify(body).includes("data:video/");
    if (hasBase64) {
      console.error("Base64 data URL detected in payload");
      return NextResponse.json({ error: "Base64 data URLs are not allowed. Please upload images/videos to storage first." }, { status: 413 });
    }

    const results = [];

    if (body.heroContent) {
      console.log("Updating hero content:", body.heroContent);
      const { id, created_at, updated_at, ...cleanData } = body.heroContent;
      const snakeCaseData = keysToSnakeCase(cleanData);
      console.log("Snake case data:", snakeCaseData);
      
      try {
        const result = await supabaseAdmin.from("hero_content").upsert({
          id: "hero-1",
          ...snakeCaseData,
          updated_at: new Date().toISOString(),
        });
        console.log("Hero content update result:", result);
        results.push({ type: "heroContent", success: !result.error, error: result.error });
      } catch (err) {
        console.error("Hero content upsert error:", err);
        results.push({ type: "heroContent", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (body.heroBackground) {
      console.log("Updating hero background:", body.heroBackground);
      const { id, created_at, updated_at, ...cleanData } = body.heroBackground;
      const snakeCaseData = keysToSnakeCase(cleanData);
      console.log("Snake case data:", snakeCaseData);
      
      try {
        const result = await supabaseAdmin.from("hero_background").upsert({
          id: "bg-1",
          ...snakeCaseData,
          updated_at: new Date().toISOString(),
        });
        console.log("Hero background update result:", result);
        results.push({ type: "heroBackground", success: !result.error, error: result.error });
      } catch (err) {
        console.error("Hero background upsert error:", err);
        results.push({ type: "heroBackground", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    if (body.platformStats) {
      console.log("Updating platform stats:", body.platformStats);
      const { id, created_at, updated_at, ...cleanData } = body.platformStats;
      const snakeCaseData = keysToSnakeCase(cleanData);
      console.log("Snake case data:", snakeCaseData);
      
      try {
        const result = await supabaseAdmin.from("platform_stats").upsert({
          id: "stats-1",
          ...snakeCaseData,
          updated_at: new Date().toISOString(),
        });
        console.log("Platform stats update result:", result);
        results.push({ type: "platformStats", success: !result.error, error: result.error });
      } catch (err) {
        console.error("Platform stats upsert error:", err);
        results.push({ type: "platformStats", success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    const hasErrors = results.some(r => !r.success);
    if (hasErrors) {
      console.error("Some updates failed:", results);
      return NextResponse.json({ success: false, results }, { status: 500 });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error updating hero:", error);
    return NextResponse.json({ error: "Failed to update hero", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
