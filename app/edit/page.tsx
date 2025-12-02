"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react"; // <-- POPRAWNY IMPORT

type Profile = {
  id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  last_username_change?: string | null;
};

export default function DashboardEdit() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [canChangeUsername, setCanChangeUsername] = useState(true);

  const fallbackAvatar = "/iconnew.png";

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!mounted) return;

      setProfile(data);
      setEmail(data.email || "");
      setUsername(data.username || "");

      if (data.last_username_change) {
        const lastChange = new Date(data.last_username_change);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        setCanChangeUsername(lastChange < oneWeekAgo);
      }

      setLoading(false);
    }

    fetchProfile();
    return () => { mounted = false; };
  }, []);

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");

    if (newPassword || confirmPassword) {
      if (!oldPassword) {
        setError("Wpisz aktualne hasło, aby zmienić nowe.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Nowe hasła nie zgadzają się.");
        return;
      }
      if (newPassword.length < 6) {
        setError("Hasło musi mieć co najmniej 6 znaków.");
        return;
      }

      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) {
        setError("Nie udało się zmienić hasła: " + pwError.message);
        return;
      }
    }

    if (email && email !== profile?.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        setError("Nie udało się zmienić emaila: " + emailError.message);
        return;
      }
    }

    if (username && username !== profile?.username) {
      if (!canChangeUsername) {
        setError("Możesz zmienić nazwę użytkownika tylko raz na tydzień.");
        return;
      }
      const { error: unameError } = await supabase
        .from("profiles")
        .update({ username, last_username_change: new Date().toISOString() })
        .eq("id", profile?.id);
      if (unameError) {
        setError("Nie udało się zmienić nazwy użytkownika: " + unameError.message);
        return;
      }
    }

    setSuccess("Profil zapisany pomyślnie!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-400">Ładowanie...</div>
    );
  }

  if (!profile) {
    return (
      <div className="p-10 text-center text-red-400">
        Nie znaleziono profilu. Zaloguj się ponownie.
        <Link href="/login" className="block mt-4 text-blue-500">Logowanie</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white pb-28 px-6">
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              <span className="text-blue-400">Ścieżka</span> Umysłu
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm hover:text-blue-300 transition">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="pt-28 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl space-y-6">
          <h3 className="text-2xl font-bold">Edytuj profil</h3>

          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}

          <div className="flex items-center gap-4">
            <img src={fallbackAvatar} alt="Avatar" className="w-16 h-16 rounded-full border border-white/10 object-cover"/>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Nazwa użytkownika { !canChangeUsername && "(tylko raz na tydzień)"}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={!canChangeUsername}
            />
          </div>

          {/* HASLA */}
          <div className="space-y-2">
            <label className="block text-sm text-neutral-400 mb-1">Zmiana hasła</label>

            <div className="flex items-center gap-2">
              <input type={showPasswords ? "text" : "password"} placeholder="Aktualne hasło" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
            </div>

            <div className="flex items-center gap-2">
              <input type={showPasswords ? "text" : "password"} placeholder="Nowe hasło" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>

              {/* POPRAWIONY BUTTON */}
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="px-3 py-2 bg-white/10 rounded-md hover:bg-white/20 transition"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input type={showPasswords ? "text" : "password"} placeholder="Powtórz nowe hasło" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
            </div>
          </div>

          <button onClick={handleSaveProfile}
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-3 rounded-2xl font-semibold shadow-xl shadow-blue-600/40">
            Zapisz zmiany
          </button>
        </motion.div>
      </main>
    </div>
  );
}
