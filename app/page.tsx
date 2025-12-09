"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const features = [
    {
      title: "Inteligentne Mentorowanie",
      desc: "Twój plan rozwoju dopasowany do Ciebie i Twoich celów.",
    },
    {
      title: "Kreator ścieżek rozwoju",
      desc: "Ucz się tego, co naprawdę ważne, i rozwijaj się w swoim tempie.",
    },
    {
      title: "Twoja prawa ręka",
      desc: "Wsparcie w każdej decyzji i każdej lekcji — zawsze pod ręką.",
    },
  ];

  const faqs = [
    {
      question: "Jak zacząć korzystać?",
      answer:
        "Wystarczy zarejestrować się, wybrać ścieżkę rozwoju i rozpocząć naukę krok po kroku.",
    },
    {
      question: "Czy mogę korzystać z platformy za darmo?",
      answer:
        "Skupiamy się na pełnym doświadczeniu premium, aby zapewnić najlepsze wsparcie i efekty.",
    },
    {
      question: "Czy Ścieżka Rozwoju to platforma która analizuje moje wyniki?",
      answer:
        "Tak, system automatycznie śledzi Twoje postępy i daje spersonalizowane rekomendacje.",
    },
  ];

  // --------------------------
  // Funkcja do Stripe Checkout
  // --------------------------
 const buyPlan = async (plan: "mini" | "standard" | "premium") => {
  if (!user) {
    window.location.href = "/login";
    return;
  }

  try {
    console.log("Tworzenie sesji Stripe dla planu:", plan, "użytkownik:", user.id);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, userId: user.id }),
    });

    const data = await res.json();

    if (res.ok && data.url) {
      // przekierowanie do Stripe Checkout
      window.location.href = data.url;
    } else {
      console.error("Błąd przy tworzeniu sesji:", data.error);
      alert("Nie udało się utworzyć sesji płatności. Spróbuj ponownie.");
    }
  } catch (err) {
    console.error("Błąd przy wywołaniu API checkout:", err);
    alert("Wystąpił błąd połączenia z serwerem.");
  }
};



  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white">
      {/* NAVBAR */}
      <nav className="w-full fixed top-0 backdrop-blur-xl bg-black/30 border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tight"
          >
            <span className="text-blue-500">Ścieżka </span> Umysłu
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            className="flex items-center gap-4"
          >
            <Link href="#features" className="hover:text-blue-400 transition">
              Funkcje
            </Link>
            <Link href="#pricing" className="hover:text-blue-400 transition">
              Cennik
            </Link>
            <Link href="#faq" className="hover:text-blue-400 transition">
              FAQ
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="ml-4 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition shadow-lg shadow-green-600/30"
                >
                  Panel
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                  }}
                  className="ml-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-600/30 text-white"
                >
                  Wyloguj się
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="ml-4 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-600/30"
              >
                Logowanie
              </Link>
            )}
          </motion.div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="pt-32 pb-40 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold leading-tight"
        >
          Twój <span className="text-blue-500">Umysł </span>Twój{" "}
          <span className="text-blue-500">Plan </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg md:text-xl mt-6 text-neutral-300"
        >
          Od pomysłu do mistrzostwa — wszystko w jednym miejscu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <Link
            href={user ? "/dashboard" : "/login"}
            className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition shadow-xl shadow-blue-600/40 text-lg"
          >
            {user ? "Przejdź do panelu" : "Rozpocznij teraz"}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-20 w-full rounded-3xl overflow-hidden shadow-xl shadow-blue-600/20 border border-white/10"
        >
          <Image
            src="/preview.png"
            alt="dashboard preview"
            width={1600}
            height={900}
            unoptimized
            className="opacity-80 hover:opacity-100 transition"
          />
        </motion.div>
      </div>

      {/* FEATURES */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-6 py-32 grid md:grid-cols-3 gap-16"
      >
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, rotateY: 15, y: 40 }}
            whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
            whileHover={{ rotateY: 10, scale: 1.05 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: true }}
            className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl hover:-translate-y-2 hover:bg-white/10 transition"
          >
            <h3 className="text-2xl mb-3 font-semibold text-blue-400">
              {f.title}
            </h3>
            <p className="text-neutral-300 text-lg">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* --------------------------- */}
      {/* PRICING */}
      {/* --------------------------- */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-32">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-20"
        >
          Cennik
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-12">
          {/* MINI */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative bg-white/5 p-10 rounded-3xl border border-white/10 shadow-xl hover:bg-white/10 transition"
          >
            <h3 className="text-2xl font-semibold text-blue-400">Mini</h3>
            <p className="text-neutral-300 mt-3 text-lg">
              Podstawowy zestaw narzędzi do lekkiego startu w rozwój osobisty.
            </p>

            <p className="text-4xl font-bold mt-6">
              39.99 <span className="text-xl">zł / mies</span>
            </p>

            <button
              onClick={() => buyPlan("mini")}
              className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition text-lg"
            >
              Wybieram ten
            </button>
          </motion.div>

          {/* STANDARD */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative bg-white/10 p-10 rounded-3xl border border-blue-500/40 shadow-2xl shadow-blue-600/20 transition"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 text-sm rounded-full shadow-md">
              Najczęściej wybierane
            </div>

            <h3 className="text-2xl font-semibold text-blue-400">Standard</h3>
            <p className="text-neutral-300 mt-3 text-lg">
              Idealny balans funkcji i ceny. Wszystko czego potrzebujesz, żeby
              rosnąć szybko.
            </p>

            <p className="text-4xl font-bold mt-6">
              59.99 <span className="text-xl">zł / mies</span>
            </p>

            <button
              onClick={() => buyPlan("standard")}
              className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition text-lg"
            >
              Wybieram ten
            </button>
          </motion.div>

          {/* PREMIUM */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative bg-white/5 p-10 rounded-3xl border border-yellow-500/40 shadow-xl hover:bg-white/10 transition"
          >
            <div className="absolute top-4 right-4 bg-yellow-600 text-black px-3 py-1 text-sm rounded-md shadow-md">
              -20%
            </div>

            <h3 className="text-2xl font-semibold text-blue-400">Premium</h3>
            <p className="text-neutral-300 mt-3 text-lg">
              Pełen dostęp do AI, priorytetowe funkcje i maksymalne tempo
              rozwoju.
            </p>

            <p className="text-4xl font-bold mt-6">
              89.99 <span className="text-xl">zł / mies</span>
            </p>

            <button
              onClick={() => buyPlan("premium")}
              className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition text-lg"
            >
              Wybieram ten
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 bg-gradient-to-r from-blue-700/30 to-blue-900/20 border-t border-white/10 text-center px-6">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold"
        >
          Zacznij w minutę. Zmień swoje życie.
        </motion.h3>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <Link
            href={user ? "/dashboard" : "/login"}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-xl rounded-2xl shadow-xl shadow-blue-600/30 transition"
          >
            {user ? "Dołącz do panelu" : "Dołącz teraz"}
          </Link>
        </motion.div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="max-w-7xl mx-auto px-6 py-32 grid md:grid-cols-3 gap-16"
      >
        {faqs.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, rotateY: 15, y: 40 }}
            whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
            whileHover={{ rotateY: 10, scale: 1.05 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: true }}
            className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl hover:-translate-y-2 hover:bg-white/10 transition"
          >
            <h3 className="text-2xl mb-3 font-semibold text-blue-400">
              {f.question}
            </h3>
            <p className="text-neutral-300 text-lg">{f.answer}</p>
          </motion.div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="py-16 text-center text-neutral-500 border-t border-white/10">
        © {new Date().getFullYear()} Mentor AI — All rights reserved.
      </footer>
    </div>
  );
}
