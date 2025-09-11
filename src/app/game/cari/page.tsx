"use client";

import { terbilang, generateRandomNumberByDifficulty, findFixedIndices } from "@/utils/number";
import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { gameData } from "@/config/game.config";
import NumberSlots from "@/app/game/cari/NumberSlots";
import TerbilangBox from "@/app/game/_components/TerbilangBox";

export default function Cari() {
    // == CONTEXT ==
    const { lives, addScore, loseLife, endGame, gameActive, difficulty, isCountdown, setOnTimeUpCallback } = useGame();
    const gameModeConfig = gameData.banyak.find(m => m.path === 'cari');
    if (!gameModeConfig) {
        throw new Error("Konfigurasi untuk mode game 'cari' tidak ditemukan.");
    }

    // == STATE ==
    const [hasilTerbilang, setHasilTerbilang] = useState("");
    const [displayDigits, setDisplayDigits] = useState<string[]>([]);
    const [wrongIndices, setWrongIndices] = useState<number[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [flashError, setFlashError] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [correctRounds, setCorrectRounds] = useState(0);

    // == HELPERS ==
    const injectWrongDigits = (targetDigits: string[], difficulty: string) => {
        const newDisplayDigits = [...targetDigits];
        const newWrongIndices: number[] = [];
        const fixedIndices = difficulty === 'mudah' ? findFixedIndices(targetDigits) : [];

        const usedIndices = new Set();

        // Tentukan jumlah angka salah berdasarkan kesulitan
        const wrongCount = (difficulty === "mudah") ? (Math.floor(Math.random() * 3) + 1) :
            (difficulty === "sedang") ? (Math.floor(Math.random() * 5) + 1) :
                (Math.floor(Math.random() * 8));

        // Loop untuk mencari posisi dan menyisipkan angka yang salah
        while (newWrongIndices.length < wrongCount) {
            const idx = Math.floor(Math.random() * targetDigits.length);

            // Lewati jika indeks sudah dipakai, merupakan indeks tetap, atau berdekatan dengan indeks salah lainnya
            if (usedIndices.has(idx) || fixedIndices.includes(idx) || newWrongIndices.some(existing => Math.abs(existing - idx) <= 1)) {
                continue;
            }

            usedIndices.add(idx);
            newWrongIndices.push(idx);
        }

        // Ganti digit pada indeks yang salah dengan digit acak yang berbeda
        newWrongIndices.forEach(idx => {
            const originalDigit = targetDigits[idx];
            let newDigit;
            do {
                newDigit = String(Math.floor(Math.random() * 10));
            } while (newDigit === originalDigit);

            newDisplayDigits[idx] = newDigit;
        });

        return {
            displayDigits: newDisplayDigits,
            wrongIndices: newWrongIndices,
        };
    };

    const setupNewRound = useCallback(() => {
        setSelectedIndices([]);
        setWrongIndices([]);
        setIsGameFinished(false);
        setIsCorrect(false);

        const targetNumber = generateRandomNumberByDifficulty(difficulty);
        const targetDigits = targetNumber.split("");

        const { displayDigits, wrongIndices } = injectWrongDigits(targetDigits, difficulty);

        setHasilTerbilang(terbilang(Number(targetNumber)));
        setDisplayDigits(displayDigits);
        setWrongIndices(wrongIndices);

    }, [difficulty]);

    // == HANDLER ==
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

    const handleTimeUp = useCallback(() => {
        handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
    }, [handleEndGame]);

    // == EFFECTS ==
    useEffect(() => {
        setOnTimeUpCallback(() => handleTimeUp);
        return () => {
            setOnTimeUpCallback(null);
        };
    }, [setOnTimeUpCallback, handleTimeUp]);

    useEffect(() => {
        if (lives <= 0 && gameActive) {
            handleEndGame("Game Over", "Nyawa Anda habis.");
        }
    }, [lives, gameActive, handleEndGame]);

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

    // == RENDER ==
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
