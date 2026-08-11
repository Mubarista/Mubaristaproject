import { NextResponse } from "next/server";
import { syncCompetitionStatuses } from "@/lib/competition";

export async function GET() {
  try {
    await syncCompetitionStatuses();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Competition status cron error:", error);
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 });
  }
}
