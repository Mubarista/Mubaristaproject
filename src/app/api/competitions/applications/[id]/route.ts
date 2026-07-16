import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";
import { validatePhoneNumber } from "@/lib/phone-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("competition_applications")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    const app = mapKeysToCamelCase(data);

    if (app?.competitionId) {
      const { data: comp } = await supabase
        .from("competitions")
        .select("id, title, entry_fee")
        .eq("id", app.competitionId)
        .single();
      const mappedComp = comp ? mapKeysToCamelCase(comp) : null;
      app.competitions = mappedComp;
      app.competition = mappedComp;
    }

    return NextResponse.json(app);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.mobileNumber) {
      const phoneValidation = validatePhoneNumber(body.mobileNumber);
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: phoneValidation.error || "Invalid phone number" }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("competition_applications")
      .update({
        ...keysToSnakeCase(body),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return NextResponse.json(mapKeysToCamelCase(data));
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from("competition_applications")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
