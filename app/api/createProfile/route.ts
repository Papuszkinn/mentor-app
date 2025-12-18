import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, email, username, full_name, role, avatar_url } = body;

  if (!id || !email || !username || !full_name || !role) {
    return NextResponse.json({ error: "Brak wymaganych danych" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert([{ id, email, username, full_name, avatar_url: avatar_url || null, role }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}
