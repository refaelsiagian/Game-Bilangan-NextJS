"use client";

import { useSearchParams } from "next/navigation";
import { GameProvider } from "./GameContext"; // Pastikan path ini benar

// Fungsi helper kecil untuk memeriksa apakah nilai difficulty valid
function isValidDifficulty(diff: string | null): diff is "mudah" | "sedang" | "sulit" {
    return diff === "mudah" || diff === "sedang" || diff === "sulit";
}

export default function GameClientWrapper({ children }: { children: React.ReactNode }) {
    // 1. Panggil useSearchParams untuk membaca URL. Ini aman karena ada di Client Component.
    const searchParams = useSearchParams();
    const diffParam = searchParams.get('diff');

    // 2. Validasi nilai dari URL. Jika tidak ada atau tidak valid, gunakan 'sedang' sebagai default.
    const difficulty = isValidDifficulty(diffParam) ? diffParam : 'sedang';

    return (
        // 3. Render GameProvider dan berikan difficulty yang sudah divalidasi sebagai prop.
        <GameProvider initialDifficulty={difficulty}>
            {children}
        </GameProvider>
    );
}

