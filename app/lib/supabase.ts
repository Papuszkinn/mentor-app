"use client";

import { createClient } from "@supabase/supabase-js";

// Klient dla frontendu – używaj tylko do operacji, które mogą być publiczne
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
