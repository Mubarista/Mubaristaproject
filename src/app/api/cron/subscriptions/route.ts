import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, buildEmailHtml } from "@/lib/email";
import { addSubscriptionDuration } from "@/lib/utils";

function generateReference() {
  return `sub-renew-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const results = { renewed: 0, failed: 0, expired: 0 };

  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("*, wallets:wallets(*)")
    .eq("is_premium", true)
    .lte("subscription_expiry", nowIso)
    .limit(100);

  if (error) {
    console.error("Subscription renewal query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ message: "No subscriptions due", results });
  }

  for (const rawUser of users) {
    const user = rawUser as any;
    const wallet = Array.isArray(user.wallets) ? user.wallets[0] : user.wallets;
    const planId = user.subscription_plan;
    const duration = user.subscription_duration as "weekly" | "monthly" | "yearly";

    if (!planId || !duration) {
      await supabaseAdmin
        .from("users")
        .update({ is_premium: false, subscription_plan: null, updated_at: nowIso })
        .eq("id", user.id);
      results.expired++;
      continue;
    }

    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (!plan || !plan.is_active) {
      await supabaseAdmin
        .from("users")
        .update({ is_premium: false, subscription_plan: null, updated_at: nowIso })
        .eq("id", user.id);
      results.expired++;
      continue;
    }

    if (user.subscription_auto_renew === false || user.subscription_canceled_at) {
      await supabaseAdmin
        .from("users")
        .update({
          is_premium: false,
          subscription_auto_renew: false,
          updated_at: nowIso,
        })
        .eq("id", user.id);
      results.expired++;
      continue;
    }

    const hasWallet = wallet && wallet.balance >= plan.price && wallet.currency === plan.currency;

    if (!hasWallet) {
      await supabaseAdmin
        .from("users")
        .update({
          is_premium: false,
          subscription_auto_renew: false,
          subscription_renewal_failures: (user.subscription_renewal_failures || 0) + 1,
          updated_at: nowIso,
        })
        .eq("id", user.id);

      const html = await buildEmailHtml({
        title: "Subscription Renewal Failed",
        body: `
          <p>Hi ${user.name || "there"},</p>
          <p>We tried to renew your <strong>${plan.name}</strong> subscription, but the payment failed because your wallet does not have enough ${plan.currency}.</p>
          <p>Please top up your wallet and resubscribe to keep your premium access.</p>
          <p>Amount due: <strong>${plan.price} ${plan.currency}</strong></p>
        `,
      });

      await sendEmail({
        to: user.email,
        subject: "MUBARISTA subscription renewal failed",
        html,
      });

      results.failed++;
      continue;
    }

    const newExpiry = addSubscriptionDuration(new Date(user.subscription_expiry), duration);
    const newExpiryIso = newExpiry.toISOString();

    await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance - plan.price,
        updated_at: nowIso,
      })
      .eq("id", wallet.id);

    await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_country: user.country || "",
      type: "premium_subscription",
      description: `Subscription renewal - ${plan.name} (${duration})`,
      amount: plan.price,
      currency: plan.currency,
      status: "completed",
      method: "wallet",
      reference: generateReference(),
      paid_at: nowIso,
    });

    await supabaseAdmin
      .from("users")
      .update({
        is_premium: true,
        subscription_expiry: newExpiryIso,
        subscription_next_renewal: newExpiryIso,
        subscription_renewal_failures: 0,
        updated_at: nowIso,
      })
      .eq("id", user.id);

    const html = await buildEmailHtml({
      title: "Subscription Renewed",
      body: `
        <p>Hi ${user.name || "there"},</p>
        <p>Your <strong>${plan.name}</strong> subscription has been renewed successfully.</p>
        <p>Amount charged: <strong>${plan.price} ${plan.currency}</strong></p>
        <p>Next renewal: <strong>${newExpiryIso}</strong></p>
      `,
    });

    await sendEmail({
      to: user.email,
      subject: "MUBARISTA subscription renewed",
      html,
    });

    results.renewed++;
  }

  return NextResponse.json({ message: "Subscription renewal run complete", results });
}
