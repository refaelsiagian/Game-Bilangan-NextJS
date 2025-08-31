// components/PreGameOverlay.tsx
"use client";
import React from "react";

interface PreGameOverlayProps {
    difficulty: "mudah" | "sedang" | "sulit";
    difficultyScore: {
        completed: number;
        correct: number;
        timeBonus: number;
    };
    onStart: () => void;
    onBack: () => void;
}

export default function PreGameOverlay({
    difficulty,
    difficultyScore,
    onStart,
    onBack,
}: PreGameOverlayProps) {
    return (
        <div
            className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 transition-opacity duration-500"
            tabIndex={0}
        >
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full transform scale-90 opacity-0 animate-endgame-popup">
                <h2 className="text-4xl font-bold mb-4">Tulis</h2>
                <div className="mb-4 text-left space-y-2 text-sm">
                    <p>
                        Terdapat bilangan 15 digit yang akan muncul dan juga papan angka
                        yang berisi tombol angka secara terbilang, satuannya, dan terbilang
                        khusus.
                    </p>
                    <p>Gunakan tombol-tombol tersebut untuk merangkai terbilang dari bilangan secara utuh.</p>
                    <p>Kesulitan: <strong>{difficulty}</strong></p>
                    <p>Hanya akan ada 3 tripel digit yang berisi angka, sisanya berisi 0</p>
                    <hr className="my-2" />
                    <div className="grid grid-cols-2 gap-x-4">
                        <span>Selesai</span>
                        <span className="text-right">{difficultyScore.completed}</span>

                        <span>Kata Benar</span>
                        <span className="text-right">x{difficultyScore.correct}</span>

                        <span>Bonus Waktu</span>
                        <span className="text-right">x{difficultyScore.timeBonus}</span>
                    </div>
                </div>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
                        onClick={onBack}
                    >
                        Kembali
                    </button>
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
                        onClick={onStart}
                    >
                        Mulai
                    </button>
                </div>
            </div>
        </div>
    );
}
