import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { jobId, userId, userEmail, userName } = await request.json();
    if (!jobId || !userId || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: purchase } = await supabaseAdmin
      .from("job_purchases")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", userId)
      .eq("status", "paid")
      .maybeSingle();
    if (!purchase) {
      return NextResponse.json({ error: "You must purchase this job to receive details" }, { status: 403 });
    }

    const { data: job, error: jobError } = await supabaseAdmin.from("jobs").select("*").eq("id", jobId).single();
    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const socials = (job.company_socials || []) as { platform?: string; url?: string }[];
    const socialsHtml = socials.length
      ? `<ul>${socials.map((s) => `<li>${s.platform || ""}: ${s.url || ""}</li>`).join("")}</ul>`
      : "<p>No social media links provided.</p>";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
        <h2 style="color: #1a1a1a;">${job.title}</h2>
        <p><strong>Company:</strong> ${job.company}</p>
        <p><strong>Location:</strong> ${job.country}</p>
        <p><strong>Salary:</strong> ${job.salary}</p>
        <p><strong>Experience:</strong> ${job.experience}</p>
        <p><strong>Type:</strong> ${job.type}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <h3 style="color: #1a1a1a;">Job Description</h3>
        <p>${job.description}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <h3 style="color: #1a1a1a;">Company Contact Details</h3>
        <p><strong>Email:</strong> ${job.company_email || "N/A"}</p>
        <p><strong>Phone:</strong> ${job.company_phone || "N/A"}</p>
        <p><strong>Website:</strong> ${job.company_website ? `<a href="${job.company_website}">${job.company_website}</a>` : "N/A"}</p>
        <h4>Social Media</h4>
        ${socialsHtml}
      </div>
    `;

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "mubarista@platform.com";
    if (!resendApiKey) {
      return NextResponse.json({ error: "Email provider not configured" }, { status: 503 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: userEmail,
        subject: `Your purchased job details: ${job.title}`,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Resend error:", text);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending job details:", error);
    return NextResponse.json({ error: "Failed to send details" }, { status: 500 });
  }
}
