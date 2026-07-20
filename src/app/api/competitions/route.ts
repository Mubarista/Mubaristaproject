import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const normalized = normalizeSlug(slug);
      const values = Array.from(new Set([slug, normalized].filter(Boolean)));
      const { data, error } = await supabaseAdmin
        .from("competitions")
        .select("*")
        .in("slug", values)
        .maybeSingle();
      if (error) {
        console.error("Error fetching competition by slug:", error);
        return NextResponse.json({ error: "Failed to fetch competition" }, { status: 500 });
      }
      if (!data) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
      return NextResponse.json(mapKeysToCamelCase(data));
    }

    const { data, error } = await supabaseAdmin.from("competitions").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data) || []);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json({ error: "Failed to fetch competitions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Creating competition:", body);
    
    // Clean the data by removing id and timestamp fields
    const { id, created_at, updated_at, ...cleanData } = body;
    const snakeCaseData = keysToSnakeCase(cleanData);
    console.log("Snake case data:", snakeCaseData);

    // Normalize slug: URL-safe, lowercased, hyphenated. Generate from title if missing.
    if (snakeCaseData.title && !snakeCaseData.slug) {
      snakeCaseData.slug = normalizeSlug(snakeCaseData.title);
    } else if (snakeCaseData.slug) {
      snakeCaseData.slug = normalizeSlug(snakeCaseData.slug);
    }

    const { data, error } = await supabaseAdmin.from("competitions").insert({
      ...snakeCaseData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
    
    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
    
    console.log("Created competition:", data);
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error creating competition:", error);
    return NextResponse.json({ error: "Failed to create competition", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("Updating competition:", body);
    
    const { id, created_at, updated_at, ...updateData } = body;
    const snakeCaseData = keysToSnakeCase(updateData);
    console.log("Snake case update data:", snakeCaseData);

    // Normalize slug when provided.
    if (snakeCaseData.slug) {
      snakeCaseData.slug = normalizeSlug(snakeCaseData.slug);
    }
    
    const { data, error } = await supabaseAdmin.from("competitions").update({
      ...snakeCaseData,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) {
      console.error("Update error:", error);
      throw error;
    }
    
    console.log("Updated competition:", data);
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating competition:", error);
    return NextResponse.json({ error: "Failed to update competition", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: "Missing competition ID" }, { status: 400 });
    }
    
    console.log("Deleting competition with ID:", id);
    
    const { error } = await supabaseAdmin.from("competitions").delete().eq("id", id);
    
    if (error) {
      console.error("Delete error:", error);
      throw error;
    }
    
    console.log("Successfully deleted competition:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting competition:", error);
    return NextResponse.json({ error: "Failed to delete competition", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}
