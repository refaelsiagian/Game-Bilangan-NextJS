"use client";

import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import PreGameOverlay from "@/app/game/_components/PreGameOverlay";
import CountdownOverlay from "@/app/game/_components/CountdownOverlay";
import EndGameOverlay from "@/app/game/_components/EndGameOverlay";

// ✨ LANGKAH 1: Tambahkan "kotak surat" ke dalam "kontrak" (interface)
interface GameContextType {
    score: number;
    lives: number;
    timer: number;
    gameActive: boolean;
    difficulty: "mudah" | "sedang" | "sulit";
    isPreGame: boolean;
    isCountdown: boolean;
    addScore: (amount: number) => void;
    loseLife: () => void;
    endGame: (result: { title: string; message: ReactNode }) => void;
    // Ini adalah "kotak surat" kita. Karyawan bisa memasukkan surat (fungsi) ke sini.
    setOnTimeUpCallback: (callback: (() => void) | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ 
    children,
    initialDifficulty 
}: { 
    children: ReactNode,
    initialDifficulty: "mudah" | "sedang" | "sulit"
}) {
    const router = useRouter();

    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timer, setTimer] = useState(120);
    const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">(initialDifficulty);
    const [gameActive, setGameActive] = useState(false);
    const [isPreGame, setIsPreGame] = useState(true);
    const [isCountdown, setIsCountdown] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [endGameInfo, setEndGameInfo] = useState<{ title: string; message: ReactNode } | null>(null);
    const [isEndGameCardVisible, setIsEndGameCardVisible] = useState(true);

    // ✨ LANGKAH 2: Buat "amplop" untuk menyimpan surat dari Karyawan
    const [onTimeUpCallback, setOnTimeUpCallback] = useState<(() => void) | null>(null);

    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const endGame = useCallback((result: { title: string; message: ReactNode }) => {
        setGameActive(false);
        setEndGameInfo(result);
        setIsEndGameCardVisible(true);
    }, []);

    // ✨ LANGKAH 3: Modifikasi tugas Boss. Sekarang dia akan memeriksa "amplop".
    useEffect(() => {
        if (gameActive && timer > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer <= 0 && gameActive) {
            // Waktu habis! Cek apakah ada surat di amplop.
            if (onTimeUpCallback) {
                onTimeUpCallback(); // Jika ada, jalankan instruksi dari surat itu.
            } else {
                // Jika amplop kosong (untuk jaga-jaga), jalankan instruksi default.
                console.warn("Waktu habis, tetapi tidak ada instruksi khusus dari mode game.");
                endGame({ title: "Waktu Habis", message: "Waktu Anda telah habis." });
            }
        }

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
        // Tambahkan onTimeUpCallback dan endGame ke dependensi
    }, [gameActive, timer, onTimeUpCallback, endGame]);

    const startGame = useCallback(() => {
        setGameActive(false);
        setIsPreGame(false);
        setEndGameInfo(null);
        setScore(0);
        setLives(3);
        setTimer(120);

        setIsCountdown(true);
        setCountdown(3);
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setIsCountdown(false);
                    setGameActive(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const loseLife = useCallback(() => {
        setLives(prevLives => {
            // Cukup kurangi nyawa dan kembalikan nilainya.
            // Tidak ada lagi pengecekan atau pemanggilan onGameOver di sini.
            return prevLives - 1;
        });
    }, []);

    const addScore = useCallback((amount: number) => {
        setScore(prev => prev + amount);
    }, []);

    const handleBackToMenu = () => router.push("/home");
    const hideEndGameCard = () => setIsEndGameCardVisible(false);
    const showEndGameCard = () => setIsEndGameCardVisible(true);

    // ✨ LANGKAH 4: Berikan "kotak surat" kepada semua Karyawan
    const value = {
        score, lives, timer, gameActive, difficulty, isPreGame, isCountdown,
        addScore, loseLife, endGame,
        setOnTimeUpCallback, // Sekarang Karyawan bisa mengakses ini
    };

    return (
        <GameContext.Provider value={value}>
            {isPreGame && <PreGameOverlay onStart={startGame} />}
            {isCountdown && <CountdownOverlay count={countdown} />}
            {endGameInfo && (
                <EndGameOverlay
                    {...endGameInfo}
                    isVisible={isEndGameCardVisible}
                    onPlayAgain={startGame}
                    onBackToMenu={handleBackToMenu}
                    onViewBoard={hideEndGameCard}
                    onShowCard={showEndGameCard}
                />
            )}
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
}
