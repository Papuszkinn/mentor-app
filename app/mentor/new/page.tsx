"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Message = {
  id?: string;
  message_type: "user" | "assistant" | string;
  content: string;
  created_at?: string;
};

type ChatSession = {
  id: string;
  title: string;
  system_prompt: string;
};

type Subscription = {
  plan: string;
  status: string;
  max_messages: number;
  messages_used: number;
};

export default function NewMentorChatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState("");
  const [newChatPrompt, setNewChatPrompt] = useState("");
  const [chatList, setChatList] = useState<ChatSession[]>([]);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [currentText, setCurrentText] = useState("Zacznij działać!");
  const [totalUserMessages, setTotalUserMessages] = useState(0);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [canSendMessages, setCanSendMessages] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const defaultAvatar = "/iconnew.png";
  const motivationalTexts = ["Zacznij działać!", "Brak wymówek!", "Twój czas jest teraz!", "Nie czekaj!"];

  // --- INIT SESSION ---
  useEffect(() => {
    let mounted = true;

    async function init() {
      setShowLoadingScreen(true);

      let i = 0;
      const interval = setInterval(() => {
        setCurrentText(motivationalTexts[i % motivationalTexts.length]);
        i++;
      }, 500);

      await new Promise(res => setTimeout(res, 3000));
      clearInterval(interval);

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        router.push("/login");
        return;
      }
      if (!mounted) return;
      setSessionUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username ?? user.id.slice(0, 8));

      const { data: chats } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setChatList(chats ?? []);
      if (chats?.length) loadChat(chats[0]);

      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("plan, status, max_messages, messages_used")
        .eq("user_id", user.id)
        .single();

      setSubscription(subData ?? null);

      if (subData) {
        const plan = subData.plan.replace(/['"]/g, "");
        const status = subData.status.replace(/['"]/g, "");
        const canSend = status === "active" && (subData.max_messages ?? 0) - (subData.messages_used ?? 0) > 0;
        setCanSendMessages(canSend);
      } else {
        setCanSendMessages(false);
      }

      const { count } = await supabase
        .from("ai_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("message_type", "user");

      setTotalUserMessages(count ?? 0);

      setShowLoadingScreen(false);
      setLoading(false);
    }

    init();
    return () => { mounted = false; };
  }, [router]);

  // --- SCROLL TO BOTTOM ---
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // --- PERSIST MESSAGE ---
  const persistMessage = async (userId: string, type: string, content: string) => {
    if (!chatSession) return;
    try {
      await supabase.from("ai_messages").insert({
        user_id: userId,
        chat_session_id: chatSession.id,
        message_type: type,
        content,
      });
      if (type === "user" && subscription) {
        await supabase
          .from("user_subscriptions")
          .update({ messages_used: subscription.messages_used + 1 })
          .eq("user_id", userId);

        setSubscription(prev => prev ? { ...prev, messages_used: prev.messages_used + 1 } : prev);
        setCanSendMessages(subscription.messages_used + 1 < subscription.max_messages);
      }
    } catch (e) { console.error(e); }
  };

  // --- LOAD CHAT ---
  const loadChat = async (chat: ChatSession) => {
    if (!sessionUserId) return;
    setChatSession(chat);
    setError(null);

    const { data: msgs, error: fetchErr } = await supabase
      .from("ai_messages")
      .select("id, message_type, content, created_at")
      .eq("user_id", sessionUserId)
      .eq("chat_session_id", chat.id)
      .order("created_at", { ascending: true });

    if (fetchErr) console.warn(fetchErr.message);
    setMessages(msgs ?? []);
  };

  // --- DELETE CHAT ---
  const deleteChat = async (chatId: string) => {
    if (!sessionUserId) return;

    await supabase
      .from("ai_messages")
      .delete()
      .eq("chat_session_id", chatId)
      .eq("user_id", sessionUserId);

    await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", chatId)
      .eq("user_id", sessionUserId);

    setChatList(prev => prev.filter(c => c.id !== chatId));

    if (chatSession?.id === chatId) {
      setChatSession(null);
      setMessages([]);
    }
  };

  // --- CREATE NEW CHAT ---
  const createNewChat = async () => {
    if (!sessionUserId || !newChatName.trim()) {
      setError("Wpisz nazwę chatu!");
      return;
    }

    setShowLoadingScreen(true);

    let i = 0;
    const interval = setInterval(() => {
      setCurrentText(motivationalTexts[i % motivationalTexts.length]);
      i++;
    }, 500);

    await new Promise(res => setTimeout(res, 2000));
    clearInterval(interval);

    const title = newChatName.trim();
    const system_prompt = newChatPrompt.trim() || "Jesteś pomocnym asystentem Mentora AI.";
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: sessionUserId, title, system_prompt })
      .select("*")
      .single();

    if (error) { setError(error.message); setShowLoadingScreen(false); return; }

    const newChat: ChatSession = { id: data.id, title: data.title, system_prompt: data.system_prompt };
    setChatList(prev => [...prev, newChat]);
    setChatSession(newChat);
    setMessages([]);
    setNewChatName("");
    setNewChatPrompt("");
    setError(null);
    setShowLoadingScreen(false);
  };

  // --- HANDLE SEND ---
  const handleSend = async () => {
    if (!input.trim() || isSending || !sessionUserId || !chatSession || !canSendMessages) return;

    setIsSending(true);
    const userText = input.trim();
    setMessages(prev => [...prev, { message_type: "user", content: userText, created_at: new Date().toISOString() }]);
    setInput("");
    await persistMessage(sessionUserId, "user", userText);

    setTotalUserMessages(prev => prev + 1);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUserId,
          systemPrompt: chatSession.system_prompt,
          messages: [
            { role: "system", content: chatSession.system_prompt },
            ...messages.slice(-6).map(m => ({ role: m.message_type === "user" ? "user" : "assistant", content: m.content })),
            { role: "user", content: userText },
          ]
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const assistantReply = typeof data.reply === "string" ? data.reply : data.reply?.content ?? "Brak odpowiedzi";
      setMessages(prev => [...prev, { message_type: "assistant", content: assistantReply, created_at: new Date().toISOString() }]);
      await persistMessage(sessionUserId, "assistant", assistantReply);
    } catch (err: any) {
      console.error(err);
      setError("Błąd serwera: " + (err.message ?? String(err)));
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-neutral-900 to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "mirror" }}
          className="text-white text-4xl font-extrabold text-center font-sans"
        >
          {currentText}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white pb-24">
      {showLoadingScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black via-neutral-900 to-black"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "mirror" }}
            className="text-white text-5xl font-extrabold text-center font-sans"
          >
            {currentText}
          </motion.div>
        </motion.div>
      )}

      <header className="fixed left-0 right-0 top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-400">Ścieżka</span>Rozwoju
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm hover:text-blue-300 transition">Strona główna</Link>
            <Link href="/dashboard" className="text-sm hover:text-blue-300 transition">Dashboard</Link>
            <button onClick={handleSignOut} className="px-3 py-1 rounded-md bg-red-600/80 hover:bg-red-600 transition text-sm">Wyloguj</button>
          </div>
        </div>
      </header>

      <main className="pt-24 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <img src={defaultAvatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-white/10" />
              <div>
                <div className="font-semibold">{username || "Guest"}</div>
                {subscription && <div className="text-xs text-neutral-400">{subscription.plan} • {subscription.status}</div>}
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-64 overflow-auto">
              {chatList.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => loadChat(c)}
                    className={`flex-1 text-left px-3 py-2 rounded-md transition ${
                      chatSession?.id === c.id ? "bg-blue-600/60" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {c.title}
                  </button>

                  <button
                    onClick={() => deleteChat(c.id)}
                    className="text-red-400 hover:text-red-300 text-lg px-2"
                    title="Usuń chat"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <input
                value={newChatName}
                onChange={e => setNewChatName(e.target.value)}
                placeholder="Nazwa nowego chatu"
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <textarea
                value={newChatPrompt}
                onChange={e => setNewChatPrompt(e.target.value)}
                placeholder="Charakter konwersacji"
                rows={4}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              />
              <button onClick={createNewChat} className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition">Utwórz nowy chat</button>
            </div>

            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
          </aside>

          <section className="lg:col-span-3 space-y-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl flex flex-col h-[60vh]">
              <div ref={scrollRef} className="overflow-auto pr-4 pb-4 flex-1">
                {chatSession ? (
                  messages.length === 0 ? (
                    <div className="text-neutral-400 mt-6 text-center">Brak wiadomości — napisz coś, żeby przetestować.</div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((m, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-xl max-w-[85%] ${m.message_type === "user" ? "ml-auto bg-blue-600/80 text-white" : "bg-white/6 text-neutral-200"}`}
                        >
                          <div>{m.content}</div>
                          <div className="text-xs text-neutral-500 mt-1">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-400">Wybierz chat lub utwórz nowy, żeby zacząć.</div>
                )}
              </div>

              <div className="mt-4 border-t border-white/6 pt-4">
                <div className="flex items-center gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={canSendMessages ? "Napisz wiadomość..." : "Nie możesz pisać — brak subskrypcji lub wiadomości"}
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/5 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    disabled={isSending || !chatSession || !canSendMessages}
                  />
                  <button
                    onClick={handleSend}
                    className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60"
                    disabled={isSending || !chatSession || !canSendMessages}
                  >
                    {isSending ? "Wysyłam..." : "Wyślij"}
                  </button>
                </div>
              </div>
            </div>

            {chatSession && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-neutral-400">Aktualny chat</div>
                    <div className="font-semibold">{chatSession?.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-400">Wiadomości</div>
                    <div className="font-semibold">{totalUserMessages}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
