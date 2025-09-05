"use client";
import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/app/game/_context/GameContext"; // 👈 Impor useGame
import { gameData } from "@/config/game.config"; // 👈 Impor gameData
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number";
import NumberSlots from "./NumberSlots";

export default function Cocokk() {
    // 1. Ambil state dan fungsi dari context
    const { addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown, lives } = useGame();

    // Ambil konfigurasi spesifik untuk mode 'cocok'
    const gameModeConfig = gameData.banyak.find(m => m.path === 'cocok');
    if (!gameModeConfig) {
        throw new Error("Konfigurasi untuk mode game 'cocok' tidak ditemukan.");
    }

    // State yang tersisa adalah yang SPESIFIK untuk gameplay "Cocok"
    const [targetNumber, setTargetNumber] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ [key: string]: 'correct' | 'wrong' }>({});
    const [answered, setAnswered] = useState(false);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [correctRounds, setCorrectRounds] = useState(0); // Untuk rekap skor akhir
    const [hintIndices, setHintIndices] = useState<number[]>([]);
    const [revealDigits, setRevealDigits] = useState<boolean>(false);



    // ... (createWrongOption dan helper-nya tidak perlu diubah) ...
    const createWrongOption = useCallback((
        currentTargetNumber: string,
        hintPositions: number[]
    ) => {
        let wrongDigits: string[] = [];
        let candidateTriples: number[] = [];
        const targetDigits = currentTargetNumber.split("");
        const targetTriples = findFixedIndices(targetDigits);
        const fixedIndices = findFixedIndices(targetDigits);

        do {
            const candidate = generateRandomNumberByDifficulty(difficulty);
            if (candidate === currentTargetNumber) continue;
            wrongDigits = candidate.split("");
            candidateTriples = findFixedIndices(wrongDigits);
        } while (!triplesMatch(targetTriples, candidateTriples));

        hintPositions.forEach(pos => {
            if (pos < wrongDigits.length && pos < currentTargetNumber.length) {
                wrongDigits[pos] = currentTargetNumber[pos];
            }
        });

        const { posToSwap, swapPos } = pickSwapPositions(hintPositions, wrongDigits, fixedIndices);

        if (posToSwap !== -1 && swapPos !== -1) {
            [wrongDigits[posToSwap], wrongDigits[swapPos]] = [wrongDigits[swapPos], wrongDigits[posToSwap]];
        }
        return wrongDigits.join("");

    }, [difficulty]);

    function pickSwapPositions(hintPositionsLocal: number[], digits: string[], fixedIndices: number[]) {
        const forbiddenIndices = new Set([...fixedIndices, ...hintPositionsLocal]);
        const shuffledHints = [...hintPositionsLocal].sort(() => 0.5 - Math.random());
        for (const posToSwap of shuffledHints) {
            const possibleDestinations: number[] = [];
            const leftPos = posToSwap - 1;
            const rightPos = posToSwap + 1;
            if (leftPos >= 0 && !forbiddenIndices.has(leftPos)) {
                possibleDestinations.push(leftPos);
            }
            if (rightPos < digits.length && !forbiddenIndices.has(rightPos)) {
                possibleDestinations.push(rightPos);
            }
            if (possibleDestinations.length > 0) {
                const swapPos = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
                return { posToSwap, swapPos };
            }
        }
        console.warn("Fallback swap triggered: No hint could be swapped with its neighbor.");
        const swappableIndices = digits
            .map((_, idx) => idx)
            .filter(idx => !fixedIndices.includes(idx));
        if (swappableIndices.length < 2) {
            return { posToSwap: -1, swapPos: -1 };
        }
        const posToSwap = swappableIndices[Math.floor(Math.random() * swappableIndices.length)];
        const possibleSwapDestinations = swappableIndices.filter(idx => idx !== posToSwap);
        const swapPos = possibleSwapDestinations[Math.floor(Math.random() * possibleSwapDestinations.length)];
        return { posToSwap, swapPos };
    }

    function triplesMatch(targetTriples: number[], wrongTriples: number[]) {
        if (targetTriples.length !== wrongTriples.length) return false;
        return targetTriples.every((val, index) => val === wrongTriples[index]);
    }

    const setupNewRound = useCallback(() => {
        setFeedback({});
        setAnswered(false);
        setRevealDigits(false);
        // Dapatkan pengaturan dari config
        const hintCount = { mudah: 3, sedang: 5, sulit: 5 }[difficulty];
        const num = generateRandomNumberByDifficulty(difficulty);
        const digits = num.split('');
        const fixedIndices = difficulty === "mudah" ? findFixedIndices(digits) : [];
        const availableIndices = digits.map((_, i) => i).filter(i => !fixedIndices.includes(i));
        const currentHintPositions: number[] = [];
        while (currentHintPositions.length < hintCount && availableIndices.length > 0) {
            const randIdx = Math.floor(Math.random() * availableIndices.length);
            const nextPos = availableIndices[randIdx];
            const isClose = difficulty === "sulit" ? currentHintPositions.some(existing => Math.abs(existing - nextPos) <= 1) : false;
            if (!isClose) {
                currentHintPositions.push(nextPos);
                availableIndices.splice(randIdx, 1);
            }
        }
        setHintIndices(currentHintPositions);
        const correctAnswerText = terbilang(Number(num));
        const currentOptions = [correctAnswerText];
        while (currentOptions.length < 4) {
            const wrongNum = createWrongOption(num, currentHintPositions);
            const wrongText = terbilang(Number(wrongNum));
            if (!currentOptions.includes(wrongText)) {
                currentOptions.push(wrongText);
            }
        }
        setTargetNumber(num);
        setOptions(shuffleArray(currentOptions));
        setCorrectAnswer(correctAnswerText);
    }, [difficulty, createWrongOption]);

    // Fungsi baru untuk menangani akhir game
    const handleEndGame = useCallback((title: string, message: string) => {
        if (isGameFinished) return;
        setIsGameFinished(true);

        const scoreDetail = gameModeConfig.difficulty[difficulty].score;

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
    }, [isGameFinished, gameModeConfig, difficulty, correctRounds, endGame]);

    const handleOptionClick = (selectedOption: string) => {
        if (!gameActive || answered || isGameFinished) return;

        // 1. Langsung set state untuk feedback visual instan
        setAnswered(true);
        setRevealDigits(true);
        const isCorrect = selectedOption === correctAnswer;
        const scoreDetail = gameModeConfig.difficulty[difficulty].score;

        if (isCorrect) {
            setFeedback({ [selectedOption]: 'correct' });
            addScore(scoreDetail.correct);
            setCorrectRounds(prev => prev + 1);

            // Atur timeout untuk ronde berikutnya
            setTimeout(() => {
                if (gameActive && !isGameFinished) {
                    setupNewRound();
                }
            }, 1200);

        } else {
            // Jawaban salah
            setFeedback({
                [selectedOption]: 'wrong',
                [correctAnswer]: 'correct'
            });

            // 2. Cek apakah ini nyawa terakhir
            const isLastLife = lives <= 1;

            // Panggil loseLife untuk update state di context
            loseLife({ onGameOver: () => { } }); // Callback dikosongkan karena kita tangani di sini

            // 3. Gunakan timeout untuk menunda aksi berikutnya (selalu)
            // Ini memastikan feedback visual selalu tampil selama 1.2 detik
            setTimeout(() => {
                if (isLastLife) {
                    // Jika ini nyawa terakhir, panggil endGame SETELAH jeda
                    handleEndGame("Game Over", "Nyawa Anda habis.");
                } else if (gameActive && !isGameFinished) {
                    // Jika bukan, mulai ronde baru SETELAH jeda
                    setupNewRound();
                }
            }, 1200);
        }
    };

    // 3. Gunakan useEffect untuk bereaksi pada perubahan context
    useEffect(() => {
        if (gameActive) {
            setIsGameFinished(false);
            setCorrectRounds(0);
            setupNewRound();
        }
    }, [gameActive, setupNewRound]);

    useEffect(() => {
        if (timer <= 0 && gameActive && !isGameFinished) {
            handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
        }
    }, [timer, gameActive, isGameFinished, handleEndGame]);

    useEffect(() => {
        if (isCountdown) {
            // Bersihkan papan untuk "Main Lagi"
            setTargetNumber('');
            setOptions([]);
            setHintIndices([]);
            setRevealDigits(false);
            setFeedback({});
        }
    }, [isCountdown]);

    // 4. Hapus semua JSX untuk overlay, render hanya gameplay
    return (
        <main className="container mx-auto py-6 relative">
            <NumberSlots
                digits={targetNumber ? targetNumber.split('') : []}
                difficulty={difficulty}
                displayLength={15}
                hintIndices={hintIndices}
                revealDigits={revealDigits}
                countdownActive={isCountdown}
            />
            <div className="lg:max-w-3xl md:max-w-2xl sm:max-w-lg max-w-sm mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, index) => {
                    const feedbackClass = feedback[option] === 'correct'
                        ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white'
                        : feedback[option] === 'wrong'
                            ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white'
                            : 'bg-white hover:bg-blue-50 border-gray-300';
                    return (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            disabled={answered || isGameFinished}
                            className={`p-4 rounded-xl shadow-md text-center transition-all duration-300 text-sm md:text-base font-semibold border-2 ${feedbackClass} ${answered || isGameFinished ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </main>
    );
}