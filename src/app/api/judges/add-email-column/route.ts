import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    // Add email column if it doesn't exist
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE judge_credentials ADD COLUMN IF NOT EXISTS email TEXT DEFAULT "";'
    });

    if (error) {
      console.error("Error adding email column:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding email column:", error);
    return NextResponse.json({ error: "Failed to add email column" }, { status: 500 });
  }
}