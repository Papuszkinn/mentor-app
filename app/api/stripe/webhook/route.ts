import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const PRICE_MAP: Record<string, { plan: string; max: number }> = {
  "price_mini_123": { plan: "Mini", max: 50 },
  "price_standard_123": { plan: "Standard", max: 300 },
  "price_premium_123": { plan: "Premium", max: 1000 },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Brak stripe-signature" }, { status: 400 });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  // Interesuje nas tylko zakończona sesja checkout
  if (event.type === "checkout.session.completed") {
    const session: any = event.data.object;

    // Pobranie line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    const firstItem = lineItems.data[0];

    if (!firstItem?.price) {
      console.error("Brak line item lub price w sesji:", session.id);
      return NextResponse.json({ ok: true });
    }

    const priceId = firstItem.price.id;
    const planData = PRICE_MAP[priceId];

    if (!planData) {
      console.error("Nieznany price_id:", priceId);
      return NextResponse.json({ ok: true });
    }

    // Pobranie userId z metadata
    const userId = session.metadata.userId;
    if (!userId) {
      console.error("Brak userId w metadata:", session.id);
      return NextResponse.json({ ok: true });
    }

    // Pobranie użytkownika z Supabase
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (!user) {
      console.error("Nie znaleziono usera o ID:", userId);
      return NextResponse.json({ ok: true });
    }

    // Zapis subskrypcji w Supabase
    await supabase.from("user_subscriptions").upsert({
      user_id: user.id,
      plan: planData.plan,
      status: "active",
      max_messages: planData.max,
      current_period_start: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages_used: 0,
    });
  }

  return NextResponse.json({ ok: true });
}
