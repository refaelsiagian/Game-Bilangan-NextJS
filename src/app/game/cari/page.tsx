// app/game/_components/Salah.tsx

"use client";
import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { terbilang, generateRandomNumberByDifficulty, findFixedIndices } from "@/utils/number";
import NumberSlots from "./NumberSlots"; // Impor komponen slot yang baru
import { gameData } from "@/config/game.config";

export default function Cari() {
    const { addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown } = useGame();

    // Ambil konfigurasi spesifik untuk mode 'salah'
    const gameModeConfig = gameData.banyak.find(m => m.path === 'cari');
    if (!gameModeConfig) {
        throw new Error("Konfigurasi untuk mode game 'salah' tidak ditemukan.");
    }

    // State spesifik untuk gameplay "Temukan yang Salah"
    const [hasilTerbilang, setHasilTerbilang] = useState("");
    const [displayDigits, setDisplayDigits] = useState<string[]>([]);
    const [wrongIndices, setWrongIndices] = useState<number[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [flashError, setFlashError] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [correctRounds, setCorrectRounds] = useState(0);

    const setupNewRound = useCallback(() => {
        setSelectedIndices([]);
        setWrongIndices([]);
        setIsGameFinished(false);
        setIsCorrect(false);

        const targetNumber = generateRandomNumberByDifficulty(difficulty);
        const targetDigits = targetNumber.split("");
        const newDisplayDigits = [...targetDigits];
        const newWrongIndices: number[] = [];

        // --- Logika injectWrongDigits dari Vanilla JS ---
        const fixedIndices = difficulty === 'mudah' ? findFixedIndices(targetDigits) : [];
        const usedIndices = new Set<number>();
        const wrongCount = (difficulty === "mudah") ? (Math.floor(Math.random() * 3) + 1) : 
            (difficulty === "sedang") ? (Math.floor(Math.random() * 5) + 1) : (Math.floor(Math.random() * 8));

        while (newWrongIndices.length < wrongCount) {
            const idx = Math.floor(Math.random() * targetDigits.length);
            if (usedIndices.has(idx) || fixedIndices.includes(idx) || newWrongIndices.some(existing => Math.abs(existing - idx) <= 1)) continue;
            usedIndices.add(idx);
            newWrongIndices.push(idx);
        }

        newWrongIndices.forEach(idx => {
            const original = targetDigits[idx];
            let newDigit;
            do {
                newDigit = String(Math.floor(Math.random() * 10));
            } while (newDigit === original);
            newDisplayDigits[idx] = newDigit;
        });
        // --- Akhir logika injectWrongDigits ---

        setHasilTerbilang(terbilang(Number(targetNumber)));
        setDisplayDigits(newDisplayDigits);
        setWrongIndices(newWrongIndices);

    }, [difficulty]);

    const handleSlotClick = (index: number) => {
        if (isGameFinished) return;
        setSelectedIndices(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleCheckAnswer = () => {
        if (isGameFinished) return;

        const selectedSet = new Set(selectedIndices);
        const wrongSet = new Set(wrongIndices);

        // Cek apakah semua yang dipilih salah, dan semua yang salah telah dipilih
        let isCorrect = selectedSet.size === wrongSet.size;
        if (isCorrect) {
            for (const idx of selectedSet) {
                if (!wrongSet.has(idx)) {
                    isCorrect = false;
                    break;
                }
            }
        }

        if (isCorrect) {
            addScore(gameModeConfig.difficulty[difficulty].score.correct); // Atau ambil skor dari config
            setIsCorrect(true);
            setCorrectRounds(prev => prev + 1);
            console.log(correctRounds)
            setTimeout(() => {
                if (gameActive) setupNewRound();
            }, 1200);
        } else {
            loseLife({
                onGameOver: () => {
                    handleEndGame("Game Over", "Nyawa Anda habis.");
                }
            });
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
        }
    };

    const handleEndGame = useCallback((title: string, message: string) => {
        if (isGameFinished) return;
        setIsGameFinished(true);

        const scoreDetail = gameModeConfig.difficulty[difficulty].score;
        console.log(correctRounds)

        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{message}</p><hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    <span>Jawaban Benar</span>
                    <span className="text-right">{correctRounds} x {scoreDetail.correct} = {correctRounds * scoreDetail.correct}</span>
                    <span className="font-bold">Total Skor</span>
                    <span className="text-right font-bold">{correctRounds * scoreDetail.correct}</span>
                </div>

            </div>
        );

        endGame({ title, message: overlayMessage });
    }, [isGameFinished, endGame, correctRounds, difficulty, gameModeConfig]);

    useEffect(() => {
        if (gameActive) {
            setCorrectRounds(0); // 👈 TAMBAHKAN BARIS INI
            setupNewRound();
        }
    }, [gameActive, setupNewRound]);

    useEffect(() => {
        if (timer <= 0 && gameActive) {
            handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
        }
    }, [timer, gameActive, handleEndGame]);

    useEffect(() => {
        if (isCountdown) {
            setDisplayDigits([]);
            setHasilTerbilang("Bersiap...");
        }
    }, [isCountdown]);

    return (
        <div>
            <div className="flex flex-col items-center">
                <NumberSlots
                    digits={displayDigits}
                    selectedIndices={selectedIndices}
                    wrongIndices={wrongIndices}
                    isGameFinished={isGameFinished}
                    onSlotClick={handleSlotClick}
                    countdownActive={isCountdown}
                    isCorrect={isCorrect}
                />

                <div className="text-center mb-4 z-10">
                    <div className={`border rounded-xl shadow-2xl p-3 min-h-[60px] min-w-[400px] sm:min-w-[600px] md:min-w-[750px] mx-auto transition ${flashError ? "bg-red-300" : "bg-[#faf8ff]"}`}>
                        <span className="text-gray-700 font-semibold">
                            {hasilTerbilang}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleCheckAnswer}
                    disabled={!gameActive || isGameFinished}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-xl text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Periksa
                </button>
            </div>
        </div>
    );
}