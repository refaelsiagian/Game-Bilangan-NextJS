"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; // 👈 import router
import Expandable from "@/components/Expandable";
import Select from "@/components/Select";

export default function MainMenu() {
    const [kategori, setKategori] = useState<"cepat" | "banyak">("cepat");
    const [expanded, setExpanded] = useState<string | null>(null);

    // Difficulty disimpan per mode (key = mode.name)
    const [difficulty, setDifficulty] = useState<Record<string, string>>({});
    const router = useRouter(); // 👈 inisialisasi router
    const [loadingMode, setLoadingMode] = useState<string | null>(null); // mode yang sedang loading

    const modes = {
        cepat: [
            { name: "Tulis", desc: "Lorem ipsum dolor sit amet, tulis jawabanmu langsung. Lorem ipsum dolor sit amet, tulis jawabanmu langsung. Lorem ipsum dolor sit amet, tulis jawabanmu langsung." },
            { name: "Pilih", desc: "Lorem ipsum dolor sit amet, pilih jawaban yang benar." },
            { name: "Isi", desc: "Lorem ipsum dolor sit amet, isi bagian kosong." },
        ],
        banyak: [
            { name: "Cari", desc: "Lorem ipsum dolor sit amet, cari bilangan yang sesuai." },
            { name: "Cocok", desc: "Lorem ipsum dolor sit amet, cocokkan bilangan yang benar." },
            { name: "Kedip", desc: "Lorem ipsum dolor sit amet, perhatikan angka yang berkedip." },
        ],
    } as const;

    const difficultyOptions = [
        { value: "Mudah", name: "Mudah", desc: "Soal dengan bilangan kecil dan operasi sederhana." },
        { value: "Sedang", name: "Sedang", desc: "Soal dengan bilangan sedang dan operasi sedang." },
        { value: "Sulit", name: "Sulit", desc: "Soal dengan bilangan besar dan operasi sulit." },
    ];

    // Helper untuk dapatkan difficulty untuk mode tertentu (default = "Mudah")
    const getDifficulty = (modeName: string) => difficulty[modeName] ?? "Mudah";

    const handlePlay = (modeName: string) => {
        setLoadingMode(modeName); // tombol mode ini jadi loading
        setTimeout(() => {
            router.push(`/game?mode=${modeName}&diff=${getDifficulty(modeName)}`);
        }, 800); // kasih delay 800ms biar spinner kelihatan
    };

    return (
        <main className="min-h-screen flex flex-col items-center p-6">
            <h1 className="text-4xl font-bold mb-6 text-amber-400">Game Bilangan</h1>

            {/* Tombol kategori */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => { setKategori("cepat"); setExpanded(null); }}
                    className={`px-6 py-2 rounded-2xl shadow-md transition ${kategori === "cepat" ? "bg-theme-purple-900 text-white" : "bg-[#f7f4ff] text-gray-700 hover:bg-gray-200"}`}
                >
                    Kerjakan Cepat
                </button>
                <button
                    onClick={() => { setKategori("banyak"); setExpanded(null); }}
                    className={`px-6 py-2 rounded-2xl shadow-md transition ${kategori === "banyak" ? "bg-theme-purple-900 text-white" : "bg-white text-gray-700 hover:bg-gray-200"}`}
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
                        className="grid gap-4 absolute w-full pb-7"
                    >
                        {/* Map setiap mode */}
                        {modes[kategori].map((mode) => {
                            const isOpen = expanded === mode.name;
                            const isLoading = loadingMode === mode.name;
                            return (
                                <motion.div
                                    layout
                                    key={mode.name}
                                    className="bg-white rounded-2xl shadow-md overflow-hidden"
                                    transition={{ layout: { type: "spring", stiffness: 0, damping: 40 } }}
                                >
                                    {/* Header card */}
                                    <motion.button
                                        layout="position"
                                        onClick={() => setExpanded(isOpen ? null : mode.name)}
                                        className="w-full text-left px-6 py-4 flex justify-between items-center hover:cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                                        aria-expanded={isOpen}
                                    >
                                        <h2 className="text-xl font-semibold">{mode.name}</h2>
                                        <span className="text-white">{isOpen ? "▲" : "▼"}</span>
                                    </motion.button>

                                    {/* Konten yang bisa diperluas */}
                                    <Expandable isOpen={isOpen}>
                                        <div className="mt-4 px-6 pb-10 flex flex-col gap-4">
                                            <p className="text-gray-600">{mode.desc}</p>

                                            <div className="mt-auto flex justify-between items-end">
                                                {/* Select kesulitan (per-mode) */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kesulitan</label>
                                                    <Select
                                                        options={difficultyOptions}
                                                        value={getDifficulty(mode.name)}
                                                        onChange={(val) =>
                                                            setDifficulty((prev) => ({ ...prev, [mode.name]: val }))
                                                        }
                                                    />
                                                </div>

                                                {/* Tombol main */}
                                                <button
                                                    onClick={() => handlePlay(mode.name)}
                                                    disabled={isLoading}
                                                    className="px-10 py-2 bg-theme-purple-850 text-white rounded-lg shadow hover:bg-theme-purple-900 transition flex items-center justify-center"
                                                >
                                                    {isLoading ? (
                                                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                        "Main"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </Expandable>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
