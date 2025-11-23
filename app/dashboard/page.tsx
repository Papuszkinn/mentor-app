"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import Link from "next/link";

type Profile = {
  id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  current_period_end?: string | null;
};

type TokenUsage = {
  used_tokens: number;
  monthly_limit: number;
  reset_date: string;
};

type Message = {
  id: string;
  message_type: string;
  content: string;
  tokens_used?: number;
  created_at?: string;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);

  // Fallback avatar
  const fallbackAvatar = "/iconnew.png";

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      // 1) pobierz usera
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;
      if (!user) {
        setLoading(false);
        return;
      }

      if (!mounted) return;
      setUserId(user.id);

      // 2) pobierz wszystkie dane równolegle
      const [
        { data: profileData },
        { data: subData },
        { data: tokensData },
        { data: messagesData },
        { data: sessionsData },
        { data: notesData },
        { data: onboardingData }
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("token_usage")
          .select("used_tokens, monthly_limit, reset_date")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("ai_messages")
          .select("id, message_type, content, tokens_used, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("chat_sessions").select("id").eq("user_id", user.id),
        supabase.from("user_notes").select("id").eq("user_id", user.id),
        supabase.from("onboarding").select("step").eq("user_id", user.id).single()
      ]);

      if (!mounted) return;

      setProfile(profileData ?? null);
      if (Array.isArray(subData) && subData.length > 0) setSubscription(subData[0] as Subscription);
      setTokens(tokensData ?? null);
      setRecentMessages(messagesData ?? []);
      setSessionCount(Array.isArray(sessionsData) ? sessionsData.length : 0);
      setNotesCount(Array.isArray(notesData) ? notesData.length : 0);
      setOnboardingStep(onboardingData?.step ?? null);

      setLoading(false);
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" }) : "-";

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white pb-28">
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              <span className="text-blue-400">Ścieżka</span> Rozwoju
            </h2>
            <p className="text-sm text-neutral-400">Panel użytkownika</p>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/mentor" className="text-sm hover:text-blue-300 transition">
              Mentor
            </Link>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 transition text-sm"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <main className="pt-28 max-w-7xl mx-auto px-6">
        {/* LOADING */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-400">Ładowanie panelu...</div>
          </div>
        ) : !userId ? (
          // NOT LOGGED IN
          <div className="p-10 bg-white/5 rounded-2xl text-center">
            <h3 className="text-2xl font-bold">Nie jesteś zalogowany</h3>
            <p className="mt-4 text-neutral-300">Zaloguj się, aby zobaczyć swój dashboard.</p>
            <Link href="/login" className="inline-block mt-6 px-6 py-3 bg-blue-600 rounded-xl">
              Zaloguj
            </Link>
          </div>
        ) : (
          // DASHBOARD CONTENT
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ==== LEWA KOLUMNA ==== */}
            <section className="lg:col-span-1 space-y-6">
              {/* PROFIL */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={profile?.avatar_url || fallbackAvatar}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <div className="text-xl font-semibold">
                      Witaj,{" "}
                      <span className="text-blue-400">
                        {profile?.username ?? profile?.full_name ?? profile?.email ?? "Nick"}
                      </span>
                      !
                    </div>
                    <div className="text-sm text-neutral-400 mt-1">
                      Konto utworzone: {fmtDate(profile?.created_at)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">ID: {profile?.id?.slice(0, 8) ?? "-"}</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xs text-neutral-300">Subskrypcja</div>
                    <div className="mt-1 font-semibold text-sm">
                      {subscription ? `${subscription.plan} • ${subscription.status}` : "Brak subskrypcji"}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xs text-neutral-300">Sesje czatu</div>
                    <div className="mt-1 font-semibold text-sm">{sessionCount}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href="/edit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition text-sm">
                    Edytuj profil
                  </Link>
                  <Link href="/dashboard/notes" className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition text-sm">
                    Notatki ({notesCount})
                  </Link>
                </div>
              </motion.div>

              {/* TOKENY */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg"
              >
                <h4 className="font-semibold text-lg">Ilość wiadomości pozostałych do wysłania</h4>
                <div className="mt-3">
                  {tokens ? (
                    <>
                      <div className="text-sm text-neutral-300">
                        Zużyte tokeny: <span className="font-semibold">{tokens.used_tokens}</span>
                      </div>
                      <div className="text-sm text-neutral-300">
                        Limit miesięczny: <span className="font-semibold">{tokens.monthly_limit}</span>
                      </div>
                      <div className="text-sm text-neutral-300 mt-1">
                        Reset: {fmtDate(tokens.reset_date)}
                      </div>

                      <div className="w-full bg-white/10 rounded-full h-3 mt-4 overflow-hidden">
                        <div
                          className="h-3 bg-blue-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (Number(tokens.used_tokens) /
                                Number(tokens.monthly_limit || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-neutral-500">Brak danych.</div>
                  )}
                </div>
              </motion.div>

              {/* ONBOARDING */}
             
            </section>

            {/* ===== ŚRODKOWA KOLUMNA ===== */}
            <section className="lg:col-span-2 space-y-6">
              {/* Ostatnie rozmowy */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Twoje ostatnie rozmowy</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Szybki podgląd — kliknij, aby otworzyć pełną rozmowę.
                    </p>
                  </div>
                  <div className="text-sm text-neutral-400">Ostatnie 6</div>
                </div>

                <div className="mt-6 space-y-3">
                  {recentMessages.length === 0 ? (
                    <div className="text-neutral-400">Brak rozmów.</div>
                  ) : (
                    recentMessages.map((m) => (
                      <motion.div
                        key={m.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-xl bg-white/10 border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-neutral-300">
                            {m.message_type.toUpperCase()}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {fmtDate(m.created_at)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-neutral-200 line-clamp-3">
                          {m.content}
                        </div>
                        <div className="mt-3 text-xs text-neutral-400">
                          Tokens: {m.tokens_used ?? 0}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Statystyki */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="p-4 rounded-lg bg-white/10">
                  <div className="text-sm text-neutral-300">Sesje czatu</div>
                  <div className="mt-2 font-semibold text-lg">{sessionCount}</div>
                </div>

                <div className="p-4 rounded-lg bg-white/10">
                  <div className="text-sm text-neutral-300">Zapisane notatki</div>
                  <div className="mt-2 font-semibold text-lg">{notesCount}</div>
                </div>

                <div className="p-4 rounded-lg bg-white/10">
                  <div className="text-sm text-neutral-300">Ostatnia aktywność</div>
                  <div className="mt-2 font-semibold text-lg">
                    {recentMessages[0] ? fmtDate(recentMessages[0].created_at) : "Brak"}
                  </div>
                </div>
              </motion.div>

              {/* Szybkie akcje */}
              <motion.div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">Szybkie akcje</h4>
                    <p className="text-sm text-neutral-400">
                      Najczęściej wykorzystywane funkcje
                    </p>
                  </div>

                  <Link href="/mentor/new" className="px-3 py-2 bg-blue-600 rounded-md text-sm">
                    Startuj nową rozmowę
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 rounded-lg bg-white/10 hover:bg-white/20 transition text-left">
                    <div className="text-xs text-neutral-300">Nowa sesja</div>
                    <div className="font-semibold mt-1">Stwórz sesję</div>
                  </button>

                  <button className="p-4 rounded-lg bg-white/10 hover:bg-white/20 transition text-left">
                    <div className="text-xs text-neutral-300">Szybkie zadanie</div>
                    <div className="font-semibold mt-1">Wygeneruj checklistę</div>
                  </button>

                  <button className="p-4 rounded-lg bg-white/10 hover:bg-white/20 transition text-left">
                    <div className="text-xs text-neutral-300">Eksport</div>
                    <div className="font-semibold mt-1">Eksport PDF</div>
                  </button>
                </div>
              </motion.div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
