import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const PRICE_MAP: Record<string, string> = {
  mini: "price_1SajczFMB0ZEMoBJVppibS4H",
  standard: "price_1Sak6UFMB0ZEMoBJYfiNTML9",
  premium: "price_1Sak42FMB0ZEMoBJ8zXLY0wO",
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json({ error: "Brak planu lub userId" }, { status: 400 });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Niepoprawny plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan },
      success_url: `${process.env.NEXT_PUBLIC_URL}/pozakupie?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Błąd przy tworzeniu sesji checkout:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
