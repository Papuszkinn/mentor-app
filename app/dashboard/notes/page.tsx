"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openNote, setOpenNote] = useState<Note | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        router.push("/login");
        return;
      }
      if (!mounted) return;
      setUserId(user.id);

      const { data: userNotes } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setNotes(userNotes ?? []);
      setLoading(false);
    }

    init();
    return () => { mounted = false; };
  }, [router]);

  const addNote = async () => {
    if (!newTitle.trim() || !userId) return;
    const noteId = uuidv4();
    const newNote: Note = { id: noteId, user_id: userId, title: newTitle.trim(), content: "" };
    setNotes(prev => [...prev, newNote]);
    setNewTitle("");

    await supabase.from("user_notes").insert({
      id: noteId,
      user_id: userId,
      title: newNote.title,
      content: "",
    });
  };

  const updateNoteContent = async (noteId: string, content: string) => {
    // aktualizujemy tablicę notes
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content } : n));
    // aktualizujemy openNote jeśli jest ta sama notatka
    setOpenNote(prev => prev && prev.id === noteId ? { ...prev, content } : prev);

    await supabase
      .from("user_notes")
      .update({ content })
      .eq("id", noteId);
  };

  const deleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (openNote?.id === noteId) setOpenNote(null);
    await supabase.from("user_notes").delete().eq("id", noteId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white text-3xl">Ładowanie notatek...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white pb-24">
      {/* HEADER */}
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

      {/* MAIN */}
      <main className="pt-24 max-w-5xl mx-auto px-6">
        <div className="flex flex-col gap-6">
          <div className="flex gap-3">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Nowa notatka"
              className="flex-1 px-4 py-2 rounded-md bg-white/5 border border-white/10 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              onKeyDown={e => { if(e.key === "Enter") addNote(); }}
            />
            <button
              onClick={addNote}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition"
            >
              Dodaj
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {notes.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 shadow-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">{note.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOpenNote(note)}
                        className="px-2 py-1 rounded-md bg-green-600 hover:bg-green-700 transition text-sm"
                      >
                        Podgląd
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-400 hover:text-red-600 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* MODAL / PODGLĄD NOTATKI */}
        <AnimatePresence>
          {openNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-3xl flex flex-col gap-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{openNote.title}</h2>
                  <button onClick={() => setOpenNote(null)} className="text-red-400 hover:text-red-600">✖</button>
                </div>
                <textarea
                      ref={textAreaRef}
                      onChange={e => updateNoteContent(openNote.id, e.target.value)}
                      placeholder="Tutaj możesz pisać swoje przemyślenia..."
                      className="w-full h-64 p-3 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                      value={openNote.content}
                      />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
