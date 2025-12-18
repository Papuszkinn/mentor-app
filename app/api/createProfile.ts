import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id, email, username, full_name, avatar_url, role } = req.body;

  if (!id || !email || !username || !full_name || !role) {
    return res.status(400).json({ error: "Brak wymaganych danych" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert([{ id, email, username, full_name, avatar_url: avatar_url || null, role }]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
