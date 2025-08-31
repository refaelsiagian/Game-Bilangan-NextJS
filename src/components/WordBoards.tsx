"use client";
import React from "react";

interface WordBoardsProps {
    countdownActive: boolean;
    setKataArray: React.Dispatch<React.SetStateAction<string[]>>;
}

const angkaDasar = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
const satuan = ["puluh", "belas", "ratus", "ribu", "juta", "miliar", "triliun"];
const khusus = ["sepuluh", "sebelas", "seratus", "seribu"];

export default function WordBoards({
    countdownActive,
    setKataArray
}: WordBoardsProps) {
    return (
        <div className="grid grid-cols-12 gap-4 mb-6 lg:max-w-[800px] md:max-w-[650px] sm:max-w-[500px] max-w-[350px] mx-auto z-10">
            {/* Angka Dasar */}
            <div className="col-span-12 md:col-span-5 bg-blue-50 rounded-lg p-4">
                <h5 className="text-center mb-2 font-semibold">Angka Dasar</h5>
                <div className="grid grid-cols-3 gap-2">
                    {angkaDasar.map((word, i) => (
                        <button
                            key={i}
                            className="px-2 py-2 rounded bg-theme-purple-300 hover:bg-theme-purple-350 w-full shadow-inner"
                            onClick={() => setKataArray((prev) => [...prev, word])}
                            disabled={countdownActive}
                        >
                            {word}
                        </button>
                    ))}
                </div>
            </div>

            {/* Satuan */}
            <div className="col-span-8 md:col-span-4 bg-gray-50 rounded-lg p-4">
                <h5 className="text-center mb-2 font-semibold">Satuan</h5>
                <div className="grid grid-cols-2 gap-2">
                    {satuan.map((word, i) => (
                        <button
                            key={i}
                            className="px-2 py-2 rounded bg-theme-purple-300 hover:bg-theme-purple-350 w-full shadow-inner"
                            onClick={() => setKataArray((prev) => [...prev, word])}
                            disabled={countdownActive}
                        >
                            {word}
                        </button>
                    ))}
                </div>
            </div>

            {/* Khusus */}
            <div className="col-span-4 md:col-span-3 bg-yellow-50 rounded-lg p-4">
                <h5 className="text-center mb-2 font-semibold">Khusus</h5>
                <div className="grid grid-cols-1 gap-2">
                    {khusus.map((word, i) => (
                        <button
                            key={i}
                            className="px-2 py-2 rounded bg-theme-purple-300 hover:bg-theme-purple-350 w-full shadow-inner"
                            onClick={() => setKataArray((prev) => [...prev, word])}
                            disabled={countdownActive}
                        >
                            {word}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
