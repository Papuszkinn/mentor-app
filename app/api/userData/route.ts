import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Brak userId" }, { status: 400 });
    }

    // Pobieramy dane tokenów
    const { data: tokenUsage, error: tokenError } = await supabaseServer
      .from("token_usage")
      .select("used_tokens, monthly_limit, reset_date")
      .eq("user_id", userId)
      .single();

    if (tokenError) throw tokenError;

    // Pobieramy krok onboardingu
    const { data: onboarding, error: onboardingError } = await supabaseServer
      .from("onboarding")
      .select("step")
      .eq("user_id", userId)
      .single();

    if (onboardingError) throw onboardingError;

    return NextResponse.json({ tokenUsage, onboarding });
  } catch (err: any) {
    console.error("Błąd w API /userData:", err);
    return NextResponse.json({ error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
