"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AfterPurchasePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) return;

    fetch("/api/verifyCheckout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white text-xl">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="text-3xl"
        >
          Ładujemy potwierdzenie płatności...
        </motion.div>
      </div>
    );

  if (!data?.ok)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500 text-xl">
        ❌ Błąd — nie znaleziono potwierdzonej płatności.
      </div>
    );

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] px-4">

      {/* 🔙 Powrót do strony głównej */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-6 left-6"
      >
        <Link
          href="/"
          className="px-5 py-2 rounded-lg border border-white/10 text-white/80 hover:text-white 
          hover:bg-white/5 transition backdrop-blur-sm text-sm shadow-md"
        >
          ← Powrót na stronę główną
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-xl w-full rounded-2xl p-10 text-white shadow-xl relative
        bg-gradient-to-br from-[#12192b] to-[#0a0f1f] border border-white/10"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl blur-2xl opacity-30 bg-blue-600/20 -z-10"></div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <motion.div
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-6xl"
          >
            🎉
          </motion.div>
        </motion.div>

        <h1 className="text-4xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Dziękujemy za zakup!
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-lg text-gray-300"
        >
          Twój zakup został pomyślnie potwierdzony.
        </motion.p>

        <div className="mt-8 space-y-3 text-center">
          <p className="text-xl">
            Pakiet:{" "}
            <span className="font-semibold text-blue-400">{data.plan}</span>
          </p>

          <p className="text-gray-400">
            Email klienta: <span className="text-white font-medium">{data.email}</span>
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center text-gray-300"
        >
          Twoja ranga zostanie nadana wkrótce.  
          <br />Administrator już otrzymał powiadomienie.
        </motion.div>
      </motion.div>
    </div>
  );
}
