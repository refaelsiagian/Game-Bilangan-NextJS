"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "@/app/game/_context/GameContext"; // 👈 Impor useGame
import { gameData } from "@/config/game.config"; // 👈 Impor gameData
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number";
import NumberSlots from "./NumberSlots";

// Helper function untuk membuat opsi salah (bisa tetap di sini atau dipindah ke utils)
function generateWrongOptions(targetNumberStr: string, difficultyLevel: "mudah" | "sedang" | "sulit", count: number): string[] {
    const result = new Set<string>();
    const correctText = terbilang(Number(targetNumberStr));
    const originalDigits = targetNumberStr.split('');
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
    let attempts = 0;
    while (result.size < count && attempts < 500) {
        attempts++;
        const candidateDigits = [...originalDigits];
        const triplesCount = Math.floor(originalDigits.length / 3);
        const triplesToPermuteCount = difficultyLevel === 'mudah' ? 1 : 2;
        const shuffledTripleIndices = shuffleArray(Array.from({ length: triplesCount }, (_, i) => i));
        const triplesToChange = shuffledTripleIndices.slice(0, triplesToPermuteCount);
        let isValidPermutation = true;
        for (const tripleIndex of triplesToChange) {
            const start = tripleIndex * 3;
            const triple = candidateDigits.slice(start, start + 3).join('');
            const perm = pickPermutation(triple);
            if (perm) {
                candidateDigits.splice(start, 3, ...perm.split(''));
            } else {
                isValidPermutation = false;
                break;
            }
        }
        if (isValidPermutation) {
            const wrongText = terbilang(Number(candidateDigits.join('')));
            if (wrongText !== correctText) {
                result.add(wrongText);
            }
        }
    }
    return Array.from(result);
}

export default function Kedip() {
    // 1. Ambil state dan fungsi dari context
    const { addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown } = useGame();

    // Ambil konfigurasi spesifik untuk mode 'kedip'
    const gameModeConfig = gameData.banyak.find(m => m.path === 'kedip');
    if (!gameModeConfig) {
        throw new Error("Konfigurasi untuk mode game 'kedip' tidak ditemukan.");
    }

    // 2. State yang tersisa adalah yang SPESIFIK untuk gameplay "Kedip"
    const [targetNumber, setTargetNumber] = useState('');
    const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean; status: 'normal' | 'wrong' | 'correct' }>>([]);
    const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
    const [fixedIndices, setFixedIndices] = useState<number[]>([]);
    const [blinkPositions, setBlinkPositions] = useState<number[]>([]);
    const [isAnsweredInRound, setIsAnsweredInRound] = useState(false);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [correctRounds, setCorrectRounds] = useState(0);
    
    // useRef untuk menyimpan interval & posisi kedip sebelumnya
    const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const roundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevBlinkPositionsRef = useRef<number[]>([]);
    const prevBlinkPositions2Ref = useRef<number[]>([]);

    // ... (setupNewRound, chooseBlinkPositions tidak banyak berubah) ...
     const setupNewRound = useCallback(() => {
        setIsAnsweredInRound(false);
        setCurrentOptionIndex(0);
        const num = generateRandomNumberByDifficulty(difficulty);
        const numDigits = num.split('');
        const currentFixedIndices = difficulty === "mudah" ? findFixedIndices(numDigits) : [];
        setTargetNumber(num);
        setFixedIndices(currentFixedIndices);
        const correctText = terbilang(Number(num));
        const wrongTexts = generateWrongOptions(num, difficulty, 1);
        const allOptionsText = shuffleArray([correctText, ...wrongTexts]);
        setOptions(allOptionsText.map(txt => ({
            text: txt,
            isCorrect: txt === correctText,
            status: 'normal',
        })));
    }, [difficulty]);

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

    // Fungsi baru untuk menangani akhir game
    const handleEndGame = useCallback((title: string, message: string) => {
        if (isGameFinished) return;
        setIsGameFinished(true);
        setIsAnsweredInRound(true); // Hentikan semua aksi
        
        if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);

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
    }, [isGameFinished, gameModeConfig, difficulty, endGame, correctRounds]);


    const handleSubmit = () => {
        if (isAnsweredInRound || options.length === 0 || isGameFinished) return;

        const selectedOption = options[currentOptionIndex];
        const scoreDetail = gameModeConfig.difficulty[difficulty].score;

        if (selectedOption.isCorrect) {
            addScore(scoreDetail.correct);
            setIsAnsweredInRound(true); // Kunci ronde
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
            setBlinkPositions([]);

            setCorrectRounds(prev => prev + 1);

            const newOptions = [...options];
            newOptions[currentOptionIndex].status = 'correct';
            setOptions(newOptions);

            roundTimeoutRef.current = setTimeout(() => {
                if (gameActive && !isGameFinished) {
                    setupNewRound();
                }
            }, 1500);

        } else {
            // Jawaban salah, nyawa berkurang tapi ronde lanjut
            const newOptions = [...options];
            newOptions[currentOptionIndex].status = 'wrong';
            setOptions(newOptions);
            
            loseLife({
                onGameOver: () => {
                    handleEndGame("Game Over", "Nyawa Anda habis.");
                }
            });
        }
    };
    
    // Navigasi tidak berubah
    const handlePrevOption = () => {
        if (isAnsweredInRound || isGameFinished) return;
        setCurrentOptionIndex(prev => (prev - 1 + options.length) % options.length);
    };
    const handleNextOption = () => {
        if (isAnsweredInRound || isGameFinished) return;
        setCurrentOptionIndex(prev => (prev + 1) % options.length);
    };

    // 3. Gunakan useEffect untuk bereaksi pada perubahan context
    useEffect(() => {
        if (gameActive) {
            setIsGameFinished(false);
            setupNewRound();
        } else {
             // Pastikan interval berhenti jika game dihentikan paksa
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        }
    }, [gameActive, setupNewRound]);
    
    useEffect(() => {
        if (timer <= 0 && gameActive && !isGameFinished) {
            handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
        }
    }, [timer, gameActive, isGameFinished, handleEndGame]);
    
    useEffect(() => {
        if (isCountdown) {
            setTargetNumber('');
            setOptions([]);
            setBlinkPositions([]);
            setIsAnsweredInRound(false);
        }
    }, [isCountdown]);

    // useEffect KHUSUS untuk interval kedip
    useEffect(() => {
        // Hanya jalankan interval jika game aktif dan pemain belum menjawab di ronde ini
        if (gameActive && !isAnsweredInRound && !isGameFinished) {
            blinkIntervalRef.current = setInterval(chooseBlinkPositions, 700);
        } else {
            if (blinkIntervalRef.current) {
                clearInterval(blinkIntervalRef.current);
            }
        }
        // Cleanup function untuk membersihkan interval saat komponen unmount atau dependensi berubah
        return () => {
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        };
    }, [gameActive, isAnsweredInRound, isGameFinished, chooseBlinkPositions]);

    // Helper untuk styling
    const currentOption = options.length > 0 ? options[currentOptionIndex] : null;
    let viewerClass = 'bg-gray-100 border-gray-300';
    if (currentOption?.status === 'correct') viewerClass = 'bg-green-200 border-green-400 text-green-800';
    else if (currentOption?.status === 'wrong') viewerClass = 'bg-red-200 border-red-400 text-red-800';

    // 4. Hapus semua JSX untuk overlay, render hanya gameplay
    return (
        <main className="container mx-auto py-6 relative">
            <NumberSlots
                digits={targetNumber ? targetNumber.split('') : []}
                difficulty={difficulty}
                activeIndices={blinkPositions}
                revealDigits={isAnsweredInRound}
                countdownActive={isCountdown}
            />
            <div className="lg:max-w-3xl md:max-w-2xl sm:max-w-lg max-w-sm mx-auto mt-6 flex flex-col items-center gap-4">
                <div className={`w-full p-4 rounded-xl shadow-md text-center font-semibold text-sm md:text-base min-h-[60px] flex items-center justify-center transition-colors duration-300 border-2 ${viewerClass}`}>
                    {currentOption ? currentOption.text : '-- Bersiap --'}
                </div>
                <div className="flex items-center justify-center gap-4">
                    <button onClick={handlePrevOption} disabled={isAnsweredInRound || !gameActive} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
                    <span className="font-bold text-white">{options.length > 0 ? `${currentOptionIndex + 1} / ${options.length}` : '0 / 0'}</span>
                    <button onClick={handleNextOption} disabled={isAnsweredInRound || !gameActive} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
                <button onClick={handleSubmit} disabled={isAnsweredInRound || !gameActive} className="px-10 py-3 rounded-xl bg-green-600 hover:bg-green-700 hover:cursor-pointer text-white font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Submit
                </button>
            </div>
        </main>
    );
}