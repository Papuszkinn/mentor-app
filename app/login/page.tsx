"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || (!isLogin && (!username || !fullName || !repeatPassword))) {
      setError("Uzupełnij wszystkie wymagane pola");
      return;
    }

    if (!isLogin && password !== repeatPassword) {
      setError("Hasła nie są takie same");
      return;
    }

    try {
      if (isLogin) {
        // LOGOWANIE
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (loginError) {
          setError(loginError.message);
          return;
        }
        if (!data.session) {
          setError("Błędny email lub hasło / konto nieaktywne");
          return;
        }

        setSuccess("Zalogowano pomyślnie!");
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/"); 
      } else {
        // REJESTRACJA
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError || !signUpData.user) {
          setError(signUpError?.message || "Błąd rejestracji");
          return;
        }

        // LOGOWANIE AUTOMATYCZNE
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError || !signInData.session) {
          setError(signInError?.message || "Nie udało się zalogować po rejestracji");
          return;
        }

        // Dodanie do tabeli profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: signUpData.user.id,
            email,
            username,
            full_name: fullName,
            avatar_url: avatarUrl || null,
            role: "user",
          });

        if (profileError) {
          setError("Błąd przy tworzeniu profilu: " + profileError.message);
          return;
        }

        setSuccess("Zarejestrowano pomyślnie! Możesz się teraz zalogować.");
        setIsLogin(true);
      }
    } catch (err) {
      setError("Wystąpił błąd serwera, spróbuj ponownie");
      console.error(err);
    }
  };

  const inputAnimation = { 
    initial: { opacity: 0, y: 20 }, 
    animate: { opacity: 1, y: 0 }, 
    transition: { duration: 0.6 } 
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white px-6">
      {/* HEADER */}
      <nav className="w-full fixed top-0 backdrop-blur-xl bg-black/30 border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold tracking-tight"
          >
            <span className="text-blue-500">Ścieżka </span>Umysłu
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} 
            className="flex items-center gap-6"
          >
            <Link href="/" className="hover:text-blue-400 transition font-semibold">Strona główna</Link>
          </motion.div>
        </div>
      </nav>

      {/* FORM */}
      <div className="flex items-center justify-center min-h-screen pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md bg-white/5 p-10 rounded-3xl border border-white/10 shadow-xl shadow-blue-600/20 backdrop-blur-lg"
        >
          {/* TOGGLE */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.6 }} 
            className="flex justify-center mb-8"
          >
            <button
              className={`px-6 py-2 rounded-l-2xl font-semibold transition ${isLogin ? "bg-blue-600 text-white shadow-lg" : "bg-white/10 text-blue-400"}`}
              onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
            >
              Logowanie
            </button>
            <button
              className={`px-6 py-2 rounded-r-2xl font-semibold transition ${!isLogin ? "bg-blue-600 text-white shadow-lg" : "bg-white/10 text-blue-400"}`}
              onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
            >
              Rejestracja
            </button>
          </motion.div>

          {/* KOMUNIKATY */}
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 mb-4 text-center">{error}</motion.p>}
          {success && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 mb-4 text-center">{success}</motion.p>}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <motion.input {...inputAnimation} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-white/10 px-4 py-3 rounded-xl placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <motion.input {...inputAnimation} type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/10 px-4 py-3 rounded-xl placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </>
            )}
            <motion.input {...inputAnimation} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/10 px-4 py-3 rounded-xl placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            <motion.div {...inputAnimation} className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 px-4 py-3 rounded-xl placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-white transition">
                {showPassword ? "🙈" : "👁️"}
              </button>
            </motion.div>
            {!isLogin && (
              <motion.div {...inputAnimation} className="relative">
                <input
                  type={showRepeatPassword ? "text" : "password"}
                  placeholder="Powtórz hasło"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="bg-white/10 px-4 py-3 rounded-xl placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full pr-12"
                />
                <button type="button" onClick={() => setShowRepeatPassword(!showRepeatPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-white transition">
                  {showRepeatPassword ? "🙈" : "👁️"}
                </button>
              </motion.div>
            )}
            <motion.button
              {...inputAnimation}
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 hover:bg-blue-700 transition py-3 rounded-2xl font-semibold shadow-xl shadow-blue-600/40 text-lg"
            >
              {isLogin ? "Zaloguj się" : "Zarejestruj się"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
