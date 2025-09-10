"use client";

import { useGame } from "@/app/game/_context/GameContext";

// Helper function bisa ditaruh di file utils terpisah atau di sini jika hanya untuk InfoBar
const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

const renderLives = (lives: number) => Array.from({ length: 3 }, (_, i) => i < lives ? "❤️" : "🖤").join("");


export default function InfoBar() {
    // 👇 Di sinilah keajaibannya terjadi!
    // Kita panggil hook useGame() untuk mendapatkan semua state dari provider.
    const { score, timer, lives } = useGame();

    return (
        <div className="flex justify-center items-center mb-3 font-bold bg-[#624b99] shadow-2xl rounded-2xl px-4 py-2 gap-16 w-[300px] sm:w-[400px] mx-auto z-10">
            <div className="flex flex-col items-center ml-2">
                <span className="md:text-sm text-xs text-amber-300 leading-tight">Skor</span>
                <span className="text-[#f7f4ff] leading-tight">{score}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="md:text-sm text-xs text-amber-300 leading-tight">Waktu</span>
                <span className="text-[#f7f4ff] leading-tight">{formatTimer(timer)}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="md:text-sm text-xs text-amber-300 leading-tight">Nyawa</span>
                <span className="text-[#f7f4ff] leading-tight">{renderLives(lives)}</span>
            </div>
        </div>
    );
}