import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from("competition_applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (applicationsError) throw applicationsError;

    const apps = (mapKeysToCamelCase(applications) || []) as any[];

    const competitionIds = [
      ...new Set(
        apps
          .map((a) => a.competitionId)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];

    let competitionsMap: Record<
      string,
      { title?: string; slug?: string; status?: string }
    > = {};

    if (competitionIds.length > 0) {
      const { data: competitions, error: competitionsError } = await supabaseAdmin
        .from("competitions")
        .select("id, title, slug, status")
        .in("id", competitionIds);

      if (competitionsError) throw competitionsError;

      competitionsMap = Object.fromEntries(
        (mapKeysToCamelCase(competitions) || []).map((comp: any) => [
          comp.id,
          { title: comp.title, slug: comp.slug, status: comp.status },
        ])
      );
    }

    const enriched = apps.map((app) => {
      const competition = app.competitionId
        ? competitionsMap[app.competitionId] || null
        : null;

      return {
        ...app,
        competitionTitle: competition?.title || null,
        competitionSlug: competition?.slug || null,
        competitionStatus: competition?.status || null,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
