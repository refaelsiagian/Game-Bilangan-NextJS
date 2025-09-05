"use client";

// 1. Hapus impor yang tidak terpakai (`usePathname`, `gameData`)
import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Impor komponen-komponen UI
import PreGameOverlay from "@/app/game/_components/PreGameOverlay";
import CountdownOverlay from "@/app/game/_components/CountdownOverlay";
import EndGameOverlay from "@/app/game/_components/EndGameOverlay";

// ... Interface GameContextType (tetap sama) ...
interface GameContextType {
    score: number;
    lives: number;
    timer: number;
    gameActive: boolean;
    difficulty: "mudah" | "sedang" | "sulit";
    isPreGame: boolean;
    isCountdown: boolean;
    addScore: (amount: number) => void;
    loseLife: (options: { onGameOver: () => void }) => void;
    endGame: (result: { title: string; message: ReactNode }) => void;
}


const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // State yang benar-benar digunakan di sini
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timer, setTimer] = useState(120);
    const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");
    const [gameActive, setGameActive] = useState(false);
    const [isPreGame, setIsPreGame] = useState(true);
    const [isCountdown, setIsCountdown] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [endGameInfo, setEndGameInfo] = useState<{ title: string; message: ReactNode } | null>(null);
    const [isEndGameCardVisible, setIsEndGameCardVisible] = useState(true);

    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        const diffParam = searchParams.get("diff") as "mudah" | "sedang" | "sulit";
        if (diffParam && ["mudah", "sedang", "sulit"].includes(diffParam)) {
            setDifficulty(diffParam); // `setDifficulty` digunakan di sini
        }
    }, [searchParams]);

    // `endGame` sekarang akan ditambahkan ke dependency array
    const endGame = useCallback((result: { title: string; message: ReactNode }) => {
        setGameActive(false);
        setEndGameInfo(result);
        setIsEndGameCardVisible(true);
    }, []);

    useEffect(() => {
        if (gameActive && timer > 0) { // Pastikan timer hanya berjalan jika > 0
            timerIntervalRef.current = setInterval(() => {
                setTimer(prev => prev - 1); // Hanya mengurangi timer
            }, 1000);
        } else if (timer <= 0 && gameActive) {
            // Jika timer habis, gameActive masih true, biarkan halaman mode yang menanganinya
            // Kita tidak memanggil endGame di sini lagi
        }

        // Cleanup function tetap sama
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameActive, timer]); // Timer sekarang menjadi dependensi

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
            setCountdown(prev => { // `setCountdown` digunakan di sini
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setIsCountdown(false); // `setIsCountdown` digunakan di sini
                    setGameActive(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // 3. Gunakan parameter di dalam fungsi
    const loseLife = useCallback((options: { onGameOver: () => void }) => {
        setLives(prevLives => { // `setLives` digunakan di sini
            const newLives = prevLives - 1;
            if (newLives <= 0) {
                options.onGameOver(); // `options` digunakan di sini
            }
            return newLives;
        });
    }, []);

    const addScore = useCallback((amount: number) => {
        setScore(prev => prev + amount); // `amount` dan `setScore` digunakan di sini
    }, []);

    const handleBackToMenu = () => router.push("/home");
    const hideEndGameCard = () => setIsEndGameCardVisible(false);
    const showEndGameCard = () => setIsEndGameCardVisible(true);

    const value = {
        score, lives, timer, gameActive, difficulty, isPreGame, isCountdown,
        addScore, loseLife, endGame,
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