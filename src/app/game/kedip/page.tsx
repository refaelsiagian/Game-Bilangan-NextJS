"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { gameData } from "@/config/game.config";
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number";
import NumberSlots from "@/app/game/kedip/NumberSlots";
import TerbilangBox from "@/app/game/_components/TerbilangBox";

export default function Kedip() {
    // == CONTEXT ==
    const { lives, addScore, loseLife, endGame, gameActive, difficulty, isCountdown, setOnTimeUpCallback } = useGame();
    const gameModeConfig = gameData.banyak.find(m => m.path === 'kedip');
    if (!gameModeConfig) {
        throw new Error("Konfigurasi untuk mode game 'kedip' tidak ditemukan.");
    }

    // == STATE ==
    const [targetNumber, setTargetNumber] = useState('');
    const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean; status: 'normal' | 'wrong' | 'correct' }>>([]);
    const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
    const [fixedIndices, setFixedIndices] = useState<number[]>([]);
    const [blinkPositions, setBlinkPositions] = useState<number[]>([]);
    const [isRoundFinished, setIsRoundFinished] = useState(false); // New state to manage round completion
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [correctRounds, setCorrectRounds] = useState(0);

    // == REFS FOR INTERVALS ==
    const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const roundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevBlinkPositionsRef = useRef<number[]>([]);
    const prevBlinkPositions2Ref = useRef<number[]>([]);

    // == HELPERS ==
    const pickPermutation = (triple: string): string | null => {
        const chars = triple.split('');
        const perms = new Set<string>();
        function permute(a: string[], l: number, r: number) {
            if (l === r) perms.add(a.join(''));
            else {
                for (let i = l; i <= r; i++) {
                    [a[l], a[i]] = [a[i], a[l]];
                    permute(a, l + 1, r);
                    [a[l], a[i]] = [a[i], a[l]];
                }
            }
        }
        permute(chars.slice(), 0, chars.length - 1);
        const candidates = Array.from(perms).filter(p => p !== triple);
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    };

    function createPermutedNumber(originalDigits: string, difficultyLevel: 'mudah' | 'sedang' | 'sulit'): string | null {
        const candidateDigits = [...originalDigits];
        const triplesCount = Math.floor(originalDigits.length / 3);
        const triplesToPermuteCount = difficultyLevel === 'mudah' ? 1 : 2;

        const shuffledTripleIndices = shuffleArray(Array.from({ length: triplesCount }, (_, i) => i));
        const triplesToChange = shuffledTripleIndices.slice(0, triplesToPermuteCount);

        for (const tripleIndex of triplesToChange) {
            const start = tripleIndex * 3;
            const triple = candidateDigits.slice(start, start + 3).join('');
            const perm = pickPermutation(triple);
            if (perm) {
                candidateDigits.splice(start, 3, ...perm.split(''));
            } else {
                return null; // Gagal membuat permutasi
            }
        }
        return candidateDigits.join(''); // Mengembalikan angka dalam bentuk string
    }

    function generateWrongOptions(targetNumberStr: string, difficultyLevel: 'mudah' | 'sedang' | 'sulit', count: number): string[] {
        const result = new Set<string>();
        const correctText = terbilang(Number(targetNumberStr));
        let attempts = 0;

        while (result.size < count && attempts < 500) {
            attempts++;
            const permutedNumberStr = createPermutedNumber(targetNumberStr, difficultyLevel);

            if (permutedNumberStr) {
                const wrongText = terbilang(Number(permutedNumberStr));
                if (wrongText !== correctText) {
                    result.add(wrongText);
                }
            }
        }

        return Array.from(result);
    }

    const chooseBlinkPositions = useCallback(() => {
        const digits = targetNumber.split('');
        if (digits.length === 0) return;

        const recentPositions = new Set([...prevBlinkPositionsRef.current, ...prevBlinkPositions2Ref.current]);
        const candidates = Array.from({ length: digits.length }, (_, i) => i)
            .filter(i => !fixedIndices.includes(i) && !recentPositions.has(i));

        let newPositions: number[] = [];
        if (difficulty === "mudah") {
            if (candidates.length > 0) newPositions = [candidates[Math.floor(Math.random() * candidates.length)]];
        } else {
            shuffleArray(candidates);
            newPositions = candidates.slice(0, 2);
        }

        prevBlinkPositions2Ref.current = prevBlinkPositionsRef.current;
        prevBlinkPositionsRef.current = newPositions;
        setBlinkPositions(newPositions);
    }, [targetNumber, difficulty, fixedIndices]);

    const setupNewRound = useCallback(() => {
        setIsRoundFinished(false);
        setCurrentOptionIndex(0);

        const num = generateRandomNumberByDifficulty(difficulty);
        const numDigits = num.split('');
        const currentFixedIndices = difficulty === "mudah" ? findFixedIndices(numDigits) : [];

        const correctText = terbilang(Number(num));
        const wrongTexts = generateWrongOptions(num, difficulty, 7);
        const allOptionsText = shuffleArray([correctText, ...wrongTexts]);

        setTargetNumber(num);
        setFixedIndices(currentFixedIndices);
        setOptions(allOptionsText.map(txt => ({
            text: txt,
            isCorrect: txt === correctText,
            status: 'normal',
        })));
    }, [difficulty]);


    // == HANDLERS ==
    const handleSubmit = () => {
        if (isGameFinished || !gameActive) return;

        const selectedOption = options[currentOptionIndex];

        // Jawaban benar:
        if (selectedOption.isCorrect) {
            addScore(gameModeConfig.difficulty[difficulty].score.correct);
            setCorrectRounds(prev => prev + 1);

            const newOptions = [...options];
            newOptions[currentOptionIndex].status = 'correct';
            setOptions(newOptions);
            setIsRoundFinished(true);

            // Hentikan interval kedip dan timeout ronde sebelumnya
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
            setBlinkPositions([]);

            roundTimeoutRef.current = setTimeout(() => {
                if (gameActive && !isGameFinished) {
                    setupNewRound();
                }
            }, 1500);
        } else {
            const newOptions = [...options];
            newOptions[currentOptionIndex].status = 'wrong';
            setOptions(newOptions);
            loseLife();
        }
    };

    const handlePrevOption = () => {
        if (isRoundFinished || !gameActive) return;
        setCurrentOptionIndex(prev => (prev - 1 + options.length) % options.length);
    };

    const handleNextOption = () => {
        if (isRoundFinished || !gameActive) return;
        setCurrentOptionIndex(prev => (prev + 1) % options.length);
    };

    const handleEndGame = useCallback((title: string, message: string) => {
        if (isGameFinished) return;
        setIsGameFinished(true);
        setIsRoundFinished(true);

        if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);

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
    }, [isGameFinished, gameModeConfig, difficulty, endGame, correctRounds]);

    const handleTimeUp = useCallback(() => {
        handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
    }, [handleEndGame]);

    // == EFFECTS ==
    useEffect(() => {
        if (gameActive && !isCountdown) {
            setIsGameFinished(false);
            setupNewRound();
        } else {
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
            setBlinkPositions([]);
        }

        return () => {
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
            if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
        };
    }, [gameActive, setupNewRound, isCountdown]);

    useEffect(() => {
        if (isCountdown) {
            setTargetNumber('');
            setOptions([]);
            setBlinkPositions([]);
            setIsRoundFinished(false);
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        }
    }, [isCountdown]);

    useEffect(() => {
        // Pastikan interval hanya berjalan saat game aktif dan ronde belum selesai
        if (gameActive && !isRoundFinished && !isGameFinished && targetNumber) {
            if (!blinkIntervalRef.current) {
                blinkIntervalRef.current = setInterval(chooseBlinkPositions, 700);
            }
        } else {
            if (blinkIntervalRef.current) {
                clearInterval(blinkIntervalRef.current);
                blinkIntervalRef.current = null;
            }
            if (isRoundFinished || isGameFinished) {
                setBlinkPositions([]);
            }
        }
        return () => {
            if (blinkIntervalRef.current) {
                clearInterval(blinkIntervalRef.current);
                blinkIntervalRef.current = null;
            }
        };
    }, [gameActive, isRoundFinished, isGameFinished, chooseBlinkPositions, targetNumber]); // Added targetNumber as dependency

    useEffect(() => {
        if (gameActive && !isCountdown) {
            setIsGameFinished(false);
            setCorrectRounds(0);
            setupNewRound();
        }
    }, [gameActive, isCountdown, setupNewRound]);

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

    // == RENDER ==
    const currentOption = options.length > 0 ? options[currentOptionIndex] : null;
    let viewerClass = 'bg-gray-100 border-2 border-gray-300';
    if (currentOption?.status === 'correct') viewerClass = 'bg-green-200 border-2 border-green-400 text-green-800';
    else if (currentOption?.status === 'wrong') viewerClass = 'bg-red-200 border-2 border-red-400 text-red-800';

    return (
        <main className="container mx-auto py-6 relative">
            <NumberSlots
                digits={targetNumber ? targetNumber.split('') : []}
                fixedIndices={fixedIndices}
                activeIndices={blinkPositions}
                revealDigits={isRoundFinished || !gameActive} // Reveal all if round finished or game not active
                countdownActive={isCountdown}
            />

            <TerbilangBox isCountdown={isCountdown} customClassName={viewerClass}>
                {currentOption?.text}
            </TerbilangBox>

            <div className="flex flex-col items-center justify-center gap-4 mt-6">
                <div className="flex items-center justify-center gap-4">
                    <button onClick={handlePrevOption}
                        disabled={isRoundFinished || !gameActive}
                        className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        Prev
                    </button>
                    <span className="font-bold text-white">{options.length > 0 ? `${currentOptionIndex + 1} / ${options.length}` : '0 / 0'}</span>
                    <button onClick={handleNextOption}
                        disabled={isRoundFinished || !gameActive}
                        className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
                <button onClick={handleSubmit}
                    disabled={isRoundFinished || !gameActive}
                    className="px-10 py-3 rounded-xl bg-green-600 hover:bg-green-700 hover:cursor-pointer text-white font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Submit
                </button>
            </div>
        </main>
    );
}