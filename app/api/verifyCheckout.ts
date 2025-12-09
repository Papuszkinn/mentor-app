import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Brak sessionId" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ ok: false, error: "Nieopłacona transakcja" });
    }

    const email = session.customer_details?.email;
    const plan = session.metadata?.plan;
    const userId = session.metadata?.userId;

    // 🔵 Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🔔 NOWY ZAKUP! @everyone\n📦 Plan: ${plan}\n👤 Email: ${email}\n🧩 UserID: ${userId}`,
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      email,
      plan,
      userId,
    });
  } catch (error) {
    console.error("verifyCheckout error:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
