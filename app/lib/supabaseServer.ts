import { createClient } from "@supabase/supabase-js";

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // tylko w server-side!
);

export const getTokenUsage = async (userId: string) => {
  const { data, error } = await supabaseServer
    .from('token_usage')
    .select('used_tokens, monthly_limit, reset_date')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const getOnboardingStep = async (userId: string) => {
  const { data, error } = await supabaseServer
    .from('onboarding')
    .select('step')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};
