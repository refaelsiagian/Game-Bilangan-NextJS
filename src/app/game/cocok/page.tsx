"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { gameData } from "@/config/game.config";
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number";
import NumberSlots from "@/app/game/cocok/NumberSlots";

export default function Cocok() {
    // == CONTEXT ==
    const { addScore, loseLife, endGame, gameActive, difficulty, isCountdown, lives, setOnTimeUpCallback } = useGame();
    const gameModeConfig = gameData.banyak.find(m => m.path === 'cocok');
    if (!gameModeConfig) {
        throw new Error("Konfigurasi untuk mode game 'cocok' tidak ditemukan.");
    }

    // == STATE ==
    const [targetNumber, setTargetNumber] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ [key: string]: 'correct' | 'wrong' }>({});
    const [answered, setAnswered] = useState(false);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [correctRounds, setCorrectRounds] = useState(0);
    const [hintIndices, setHintIndices] = useState<number[]>([]);
    const [revealDigits, setRevealDigits] = useState<boolean>(false);

    // == HELPERS ===
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
                if (digits[posToSwap] !== digits[swapPos]) {
                    return { posToSwap, swapPos };
                }
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

    const generateHintPositions = useCallback((
        digits: string[], 
        difficulty: 'mudah' | 'sedang' | 'sulit', 
        fixedIndices: number[]
    ) => {
        const hintCount = { mudah: 3, sedang: 5, sulit: 5 }[difficulty];
        const availableIndices = digits
            .map((_, i) => i)
            .filter(i => !fixedIndices.includes(i));

        const currentHintPositions = [];
        while (currentHintPositions.length < hintCount && availableIndices.length > 0) {
            const randIdx = Math.floor(Math.random() * availableIndices.length);
            const nextPos = availableIndices[randIdx];

            // Logika khusus untuk tingkat 'sulit' agar hint tidak berdekatan
            const isClose = difficulty === "sulit"
                ? currentHintPositions.some(existing => Math.abs(existing - nextPos) <= 1)
                : false;

            if (!isClose) {
                currentHintPositions.push(nextPos);
                availableIndices.splice(randIdx, 1);
            }
        }
        return currentHintPositions;
    }, []);

    const generateAnswerOptions = useCallback((correctNumber: string, hintPositions: number[]) => {
        const correctAnswerText = terbilang(Number(correctNumber));
        const options = [correctAnswerText];

        while (options.length < 4) {
            // Kita asumsikan createWrongOption sudah tersedia dari konteks sebelumnya
            const wrongNum = createWrongOption(correctNumber, hintPositions);
            const wrongText = terbilang(Number(wrongNum));

            if (!options.includes(wrongText)) {
                options.push(wrongText);
            }
        }
        return options;
    }, [createWrongOption]);

    const setupNewRound = useCallback(() => {
        setFeedback({});
        setAnswered(false);
        setRevealDigits(false);

        const num = generateRandomNumberByDifficulty(difficulty);
        const digits = num.split('');
        const fixedIndices = difficulty === "mudah" ? findFixedIndices(digits) : [];
        const hintPositions = generateHintPositions(digits, difficulty, fixedIndices);
        const allOptions = generateAnswerOptions(num, hintPositions);
        
        setTargetNumber(num);
        setOptions(shuffleArray(allOptions));
        setHintIndices([...hintPositions, ...fixedIndices]);
        setCorrectAnswer(terbilang(Number(num)));
    }, [difficulty, generateHintPositions, generateAnswerOptions]);

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
    }, [isGameFinished, gameModeConfig, difficulty, correctRounds, endGame]);

    // ✨ 3. Buat "surat instruksi" untuk Boss jika waktu habis
    const handleTimeUp = useCallback(() => {
        setAnswered(true);
        setRevealDigits(true);

        // 2. Set state 'feedback' untuk menyorot jawaban yang benar dengan warna hijau
        setFeedback({
            [correctAnswer]: 'correct'
        });

        handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
    }, [handleEndGame, correctAnswer]);

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


    const handleOptionClick = (selectedOption: string) => {
        if (!gameActive || answered || isGameFinished) return;

        setAnswered(true);
        setRevealDigits(true);
        const isCorrect = selectedOption === correctAnswer;

        if (isCorrect) {
            setFeedback({ [selectedOption]: 'correct' });
            addScore(gameModeConfig.difficulty[difficulty].score.correct);
            setCorrectRounds(prev => prev + 1);

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

            // ✨ 6. Panggil loseLife versi sederhana dan biarkan useEffect yang menanganinya
            loseLife();

            // Atur timeout untuk ronde berikutnya jika nyawa masih ada
            setTimeout(() => {
                if (gameActive && !isGameFinished && lives > 1) { // Cek lives > 1 karena update state async
                    setupNewRound();
                }
            }, 1200);
        }
    };

    // useEffect lainnya tetap sama
    useEffect(() => {
        if (gameActive) {
            setIsGameFinished(false);
            setCorrectRounds(0);
            setupNewRound();
        }
    }, [gameActive, setupNewRound]);

    useEffect(() => {
        if (isCountdown) {
            setTargetNumber('');
            setOptions([]);
            setHintIndices([]);
            setRevealDigits(false);
            setFeedback({});
        }
    }, [isCountdown]);

    return (
        <main className="container mx-auto py-6 relative">
            <NumberSlots
                digits={targetNumber ? targetNumber.split('') : []}
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
