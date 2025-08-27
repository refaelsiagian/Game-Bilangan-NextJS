// app/page.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MainMenu() {
  const [kategori, setKategori] = useState<"cepat" | "banyak">("cepat");
  const [expanded, setExpanded] = useState<string | null>(null);

  const modes = {
    cepat: [
      { name: "Tulis", desc: "Lorem ipsum dolor sit amet, tulis jawabanmu langsung." },
      { name: "Pilih", desc: "Lorem ipsum dolor sit amet, pilih jawaban yang benar." },
      { name: "Isi", desc: "Lorem ipsum dolor sit amet, isi bagian kosong." },
    ],
    banyak: [
      { name: "Cari", desc: "Lorem ipsum dolor sit amet, cari bilangan yang sesuai." },
      { name: "Cocok", desc: "Lorem ipsum dolor sit amet, cocokkan bilangan yang benar." },
      { name: "Kedip", desc: "Lorem ipsum dolor sit amet, perhatikan angka yang berkedip." },
    ],
  };

  const contentVariants = {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.28, ease: "easeInOut" },
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold mb-6 text-amber-400">Game Bilangan</h1>

      {/* Tombol kategori */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => { setKategori("cepat"); setExpanded(null); }}
          className={`px-6 py-2 rounded-2xl shadow-md transition ${
            kategori === "cepat" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          Kerjakan Cepat
        </button>
        <button
          onClick={() => { setKategori("banyak"); setExpanded(null); }}
          className={`px-6 py-2 rounded-2xl shadow-md transition ${
            kategori === "banyak" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          Kerjakan Banyak
        </button>
      </div>

      {/* Card list mode dengan transisi antar kategori (slide) */}
      <div className="relative w-full max-w-2xl min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={kategori}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="grid gap-4 absolute w-full"
          >
            {modes[kategori].map((mode) => {
              const isOpen = expanded === mode.name;
              return (
                <motion.div
                  layout
                  key={mode.name}
                  className="bg-white rounded-2xl shadow-md overflow-hidden"
                  transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
                >
                  {/* Header card */}
                  <motion.button
                    layout="position"
                    onClick={() => setExpanded(isOpen ? null : mode.name)}
                    className="w-full text-left px-6 py-4 flex justify-between items-center"
                    aria-expanded={isOpen}
                  >
                    <h2 className="text-xl font-semibold">{mode.name}</h2>
                    <span className="text-gray-500">{isOpen ? "▲" : "▼"}</span>
                  </motion.button>

                  {/* Konten expand -> pakai scaleY supaya tutupnya mulus */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        // pakai variants supaya animasi height dari/ke "auto" bekerja
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={contentVariants}
                        className="px-6 pb-6 flex flex-col gap-4 overflow-hidden"
                        // style transformOrigin tidak perlu kalau pakai height
                      >
                        <p className="text-gray-600">{mode.desc}</p>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pilih Kesulitan
                          </label>
                          <select className="w-full border rounded-lg px-3 py-2">
                            <option>Mudah</option>
                            <option>Sedang</option>
                            <option>Sulit</option>
                          </select>
                        </div>

                        <button className="self-start px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                          Main
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
