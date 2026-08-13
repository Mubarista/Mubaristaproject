import { NextResponse } from "next/server";
import { sendEmail, buildEmailHtml, getSiteLogo } from "@/lib/email";

const SUPPORT_EMAIL = "support@mubarista.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      method,
      competitionTitle,
      fullName,
      gender,
      profilePhoto,
      nationalId,
      homeAddress,
      nationality,
      walletCompany,
      walletNumber,
      bankName,
      accountNumber,
    } = body;

    if (!to || !method || !fullName || !gender || !homeAddress || !nationality) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const logoUrl = (await getSiteLogo()) || "";

    const paymentMethodHtml =
      method === "mobile"
        ? `<p><strong>Withdrawal method:</strong> Mobile Wallet</p>
           <p><strong>Wallet company:</strong> ${walletCompany || "Not provided"}</p>
           <p><strong>Wallet number:</strong> ${walletNumber || "Not provided"}</p>`
        : `<p><strong>Withdrawal method:</strong> Bank Transfer</p>
           <p><strong>Bank name:</strong> ${bankName || "Not provided"}</p>
           <p><strong>Account number:</strong> ${accountNumber || "Not provided"}</p>`;

    const bodyHtml = `
      <p style="font-size:18px;font-weight:600;">Hi ${fullName},</p>
      <p>
        Congratulations on winning a prize for <strong>${
          competitionTitle || "the competition"
        }</strong>! Your withdrawal request has been received and is being processed.
      </p>
      ${paymentMethodHtml}
      <p>
        Your prize will be delivered within <strong>3 to 5 business days</strong>.
      </p>
      <p>
        Please note that sometimes funds may be delayed by your network provider or country restrictions. If you experience a longer delay, please contact the MUBARISTA Hub support team at
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#3b82f6;">${SUPPORT_EMAIL}</a>.
      </p>
      <p style="font-weight:600;">Information on file:</p>
      <ul style="padding-left:20px;">
        <li>Full legal name: ${fullName}</li>
        <li>Gender: ${gender}</li>
        <li>Home address: ${homeAddress}</li>
        <li>Nationality: ${nationality}</li>
        ${profilePhoto ? `<li>Profile photo: <a href="${profilePhoto}" style="color:#3b82f6;">View</a></li>` : ""}
        ${nationalId ? `<li>National ID: <a href="${nationalId}" style="color:#3b82f6;">View</a></li>` : ""}
      </ul>
      <p style="margin-top:24px;">
        Thank you for being part of MUBARISTA Hub. We look forward to seeing you in more competitions.
      </p>
    `;

    const html = await buildEmailHtml({
      title: "Prize withdrawal request",
      body: bodyHtml,
      logoUrl,
    });

    const { sent, error } = await sendEmail({
      to,
      subject: "Your prize withdrawal request",
      fromName: "MUBARISTA HUB LTD",
      fromEmail: "team@mubarista.com",
      html,
    });

    if (!sent) {
      console.error("Withdrawal email failed:", error);
      return NextResponse.json({ error: error || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Withdrawal API error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal request" }, { status: 500 });
  }
}
