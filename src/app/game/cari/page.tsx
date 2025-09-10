"use client";
import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { terbilang, generateRandomNumberByDifficulty, findFixedIndices } from "@/utils/number";
import NumberSlots from "./NumberSlots";
import TerbilangBox from "@/app/game/_components/TerbilangBox";
import { gameData } from "@/config/game.config";

export default function Cari() {
    // ✨ 1. Ambil 'lives' dan 'setOnTimeUpCallback' dari context
    const { lives, addScore, loseLife, endGame, gameActive, difficulty, isCountdown, setOnTimeUpCallback } = useGame();

    const gameModeConfig = gameData.banyak.find(m => m.path === 'cari');
    if (!gameModeConfig) {
        throw new Error("Konfigurasi untuk mode game 'cari' tidak ditemukan.");
    }

    // State lokal tidak berubah
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

    // ✨ 2. Pindahkan logika skor akhir ke handleEndGame
    const handleEndGame = useCallback((title: string, message: string) => {
        if (isGameFinished) return;
        setIsGameFinished(true);

        const scoreDetail = gameModeConfig.difficulty[difficulty].score;
        const totalScore = correctRounds * scoreDetail.correct;

        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{message}</p><hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    <span>Jawaban Benar</span>
                    <span className="text-right">{correctRounds} x {scoreDetail.correct} = {totalScore}</span>
                    <span className="font-bold">Total Skor</span>
                    <span className="text-right font-bold">{totalScore}</span>
                </div>
            </div>
        );

        endGame({ title, message: overlayMessage });
    }, [isGameFinished, endGame, correctRounds, difficulty, gameModeConfig]);

    // ✨ 3. Buat "surat instruksi" untuk Boss jika waktu habis
    const handleTimeUp = useCallback(() => {
        handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
    }, [handleEndGame]);

    // ✨ 4. Terapkan pola "Amplop": Daftarkan instruksi ke Boss
    useEffect(() => {
        setOnTimeUpCallback(() => handleTimeUp);
        return () => {
            setOnTimeUpCallback(null);
        };
    }, [setOnTimeUpCallback, handleTimeUp]);

    // ✨ 5. Terapkan pola Reaktif: Awasi nyawa
    useEffect(() => {
        if (lives <= 0 && gameActive) {
            handleEndGame("Game Over", "Nyawa Anda habis.");
        }
    }, [lives, gameActive, handleEndGame]);


    const handleCheckAnswer = () => {
        if (isGameFinished) return;

        const selectedSet = new Set(selectedIndices);
        const wrongSet = new Set(wrongIndices);

        let isAnswerCorrect = selectedSet.size === wrongSet.size;
        if (isAnswerCorrect) {
            for (const idx of selectedSet) {
                if (!wrongSet.has(idx)) {
                    isAnswerCorrect = false;
                    break;
                }
            }
        }

        if (isAnswerCorrect) {
            addScore(gameModeConfig.difficulty[difficulty].score.correct);
            setIsCorrect(true);
            setCorrectRounds(prev => prev + 1);
            setTimeout(() => {
                if (gameActive) setupNewRound();
            }, 1200);
        } else {
            // ✨ 6. Panggil loseLife versi sederhana
            loseLife();
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
        }
    };

    useEffect(() => {
        if (gameActive) {
            setCorrectRounds(0);
            setupNewRound();
        }
    }, [gameActive, setupNewRound]);

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
                    isGameActive={gameActive}
                />

                <TerbilangBox isCountdown={isCountdown} flashError={flashError} isMuted={isCountdown || hasilTerbilang === ""}>
                    {hasilTerbilang}
                </TerbilangBox>

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
