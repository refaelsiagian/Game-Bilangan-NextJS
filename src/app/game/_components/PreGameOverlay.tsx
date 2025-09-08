"use client";

import { usePathname } from "next/navigation";
import { useGame } from "@/app/game/_context/GameContext";
import { gameData } from "@/config/game.config";
import React from "react";

export default function PreGameOverlay({ onStart }: { onStart: () => void }) {
    const { difficulty } = useGame();
    const pathname = usePathname(); // e.g., "/game/tulis"
    const modePath = pathname.split('/').pop() || "";

    // Cari data untuk mode game yang aktif
    const gameMode = Object.values(gameData)
        .flat()
        .find(mode => mode.path === modePath);

    const difficultySetting = gameMode?.difficulty[difficulty];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full animate-endgame-popup">
                <h2 className="text-4xl font-bold mb-4">{gameMode?.name || "Siap Bermain?"}</h2>

                <div className="mb-6 text-left space-y-2 text-gray-600">
                    {/* Yang ini sudah benar, karena <p> punya key */}
                    {gameMode?.desc.map((p, i) => <p key={i}>{p}</p>)}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
                    <h3 className="font-semibold mb-2">Kesulitan: <span className="font-bold text-purple-700">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span></h3>
                    <p className="text-sm text-gray-500 mb-3">{difficultySetting?.desc}</p>
                    <hr />
                    <h4 className="font-semibold mt-3 mb-2">Perolehan Skor:</h4>
                    <div className="grid grid-cols-2 gap-x-4 text-sm">
                        {difficultySetting?.score && Object.entries(difficultySetting.score).map(([key, value]) => (
                            // ✨ SOLUSINYA DI SINI: Tambahkan `key` ke Fragment ✨
                            <React.Fragment key={key}>
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="text-right font-semibold">{value} poin</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <button onClick={onStart} className="bg-green-600 hover:bg-green-700 transition-colors text-white px-10 py-3 text-lg font-bold rounded-lg shadow-lg">
                    Mulai
                </button>
            </div>
        </div>
    );
}
