import { NextRequest, NextResponse } from "next/server";
import { getTokenUsage } from "@/app/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  try {
    const data = await getTokenUsage(userId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Błąd pobierania danych' }, { status: 500 });
  }
}
