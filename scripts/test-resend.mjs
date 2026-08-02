import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const to = process.argv[2] || "iraguhamubarak23@gmail.com";

if (!RESEND_API_KEY) {
  console.error("Error: RESEND_API_KEY is not set. Run `npx vercel env pull` or add it to .env.local.");
  process.exit(1);
}

const html = `
<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 24px auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
    <h1 style="color: #111827;">MUBARISTA test email</h1>
    <p>This confirms Resend is working from your verified domain <strong>${RESEND_FROM_EMAIL}</strong>.</p>
    <p style="color: #6b7280;">You do not need a Resend template — the app builds email HTML inline.</p>
  </body>
</html>
`;

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
    from: `"MUBARISTA" <${RESEND_FROM_EMAIL}>`,
    to,
    subject: "Resend test from MUBARISTA",
    html,
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error("Resend error:", res.status, text);
  process.exit(1);
}

const data = await res.json();
console.log("Email queued successfully:", data);
