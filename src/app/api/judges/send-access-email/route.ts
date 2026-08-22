import { NextRequest, NextResponse } from "next/server";
import { sendJudgeAccessEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, name, username, password, accessLink, competitionTitle, expiresAt } = body;

    if (!to || !name || !username || !password || !accessLink) {
      return NextResponse.json(
        { error: "Missing required fields: to, name, username, password, accessLink" },
        { status: 400 }
      );
    }

    const result = await sendJudgeAccessEmail({
      to,
      name,
      username,
      password,
      accessLink,
      competitionTitle,
      expiresAt,
    });

    if (result.sent) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending judge access email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}