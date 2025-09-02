"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Orbitron } from "next/font/google";
import { useSearchParams } from "next/navigation";
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number"; // Pastikan path utilitas benar
import { JSX } from "react";

import NumberSlots from "@/components/NumbersSlot"; // Kita akan gunakan komponen yang sama
import { tr } from "framer-motion/client";

const orbitron = Orbitron({ subsets: ["latin"], weight: "500", variable: "--font-orbitron" });

// Skor disesuaikan per ronde yang benar
const difficultyScore = {
    mudah: { correct: 15, timeBonus: 1 },
    sedang: { correct: 25, timeBonus: 2 },
    sulit: { correct: 35, timeBonus: 3 }
};

const DEFAULT_TIME = 120;

// Helper function untuk membuat opsi jawaban salah (diadaptasi dari kode vanilla JS)
function generateWrongOptions(targetNumberStr: string, difficultyLevel: "mudah" | "sedang" | "sulit", count: number): string[] {
    const result = new Set<string>();
    const correctText = terbilang(Number(targetNumberStr));
    const originalDigits = targetNumberStr.split('');

    // Fungsi kecil untuk permutasi 3 digit
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
    const searchParams = useSearchParams();

    // State global game (sama seperti mode Cocok)
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState<number>(DEFAULT_TIME);
    const [lives, setLives] = useState(3);
    const [gameActive, setGameActive] = useState(false);
    const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");

    // State spesifik untuk gameplay "Kedip"
    const [targetNumber, setTargetNumber] = useState('');
    const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean; status: 'normal' | 'wrong' | 'correct' }>>([]);
    const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
    const [fixedIndices, setFixedIndices] = useState<number[]>([]);
    const [blinkPositions, setBlinkPositions] = useState<number[]>([]);
    const [isAnswered, setIsAnswered] = useState(false);

    // useRef untuk menyimpan interval & posisi kedip sebelumnya
    const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const prevBlinkPositionsRef = useRef<number[]>([]);
    const prevBlinkPositions2Ref = useRef<number[]>([]);

    // State untuk UI (sama seperti mode Cocok)
    const [endGameOverlay, setEndGameOverlay] = useState<{ title: string; message: string | JSX.Element; } | null>(null);
    const [preGameOverlayVisible, setPreGameOverlayVisible] = useState(true);
    const [endGameCardVisible, setEndGameCardVisible] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [countdownActive, setCountdownActive] = useState(false);

    const normalizeDifficulty = (raw?: string | null) => {
        if (!raw) return "sedang";
        const v = raw.toLowerCase();
        if (v === "mudah" || v === "sedang" || v === "sulit") return v as "mudah" | "sedang" | "sulit";
        return "sedang";
    };

    const chooseBlinkPositions = useCallback(() => {
        const digits = targetNumber.split('');
        const totalDigits = digits.length;
        if (totalDigits === 0) return;

        let newPositions: number[] = [];
        const recentPositions = new Set([...prevBlinkPositionsRef.current, ...prevBlinkPositions2Ref.current]);

        const candidates = Array.from({ length: totalDigits }, (_, i) => i)
            .filter(i => !fixedIndices.includes(i) && !recentPositions.has(i));

        if (difficulty === "mudah") {
            if (candidates.length > 0) {
                newPositions = [candidates[Math.floor(Math.random() * candidates.length)]];
            }
        } else {
            shuffleArray(candidates);
            newPositions = candidates.slice(0, 2);
        }

        prevBlinkPositions2Ref.current = prevBlinkPositionsRef.current;
        prevBlinkPositionsRef.current = newPositions;
        setBlinkPositions(newPositions);
    }, [targetNumber, difficulty, fixedIndices]);


    const setupNewRound = useCallback((currentDifficulty: "mudah" | "sedang" | "sulit") => {
        setIsAnswered(false);
        setCurrentOptionIndex(0);

        const num = generateRandomNumberByDifficulty(currentDifficulty);
        const numDigits = num.split('');
        const currentFixedIndices = currentDifficulty === "mudah" ? findFixedIndices(numDigits) : [];

        setTargetNumber(num);
        setFixedIndices(currentFixedIndices);

        const correctText = terbilang(Number(num));
        const wrongTexts = generateWrongOptions(num, currentDifficulty, 1);
        const allOptionsText = shuffleArray([correctText, ...wrongTexts]);

        setOptions(allOptionsText.map(txt => ({
            text: txt,
            isCorrect: txt === correctText,
            status: 'normal', // Tambahkan properti status
        })));

    }, []);

    const handleSubmit = () => {
        // Jangan proses jika sudah dijawab benar di ronde ini atau tidak ada opsi
        if (isAnswered || options.length === 0) return;

        const selectedOption = options[currentOptionIndex];

        if (selectedOption.isCorrect) {
            setScore(prev => prev + difficultyScore[difficulty].correct);
            setIsAnswered(true); // Kunci ronde ini agar tidak bisa submit lagi
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
            setBlinkPositions([]);

            // Buat salinan options dan ubah status menjadi 'correct'
            const newOptions = [...options];
            newOptions[currentOptionIndex].status = 'correct';
            setOptions(newOptions);

            setTimeout(() => {
                if (gameActive) { // Pastikan game masih aktif sebelum lanjut
                    setupNewRound(difficulty);
                }
            }, 1500);

        } else {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    endGame("💀 Nyawa habis!");
                    return 0;
                }
                return newLives;
            });

            // Buat salinan options dan ubah status menjadi 'wrong'
            // Jawaban yang salah akan tetap merah bahkan setelah di-swipe
            const newOptions = [...options];
            newOptions[currentOptionIndex].status = 'wrong';
            setOptions(newOptions);
        }
    };

    const handlePrevOption = () => {
        if (isAnswered) return;
        setCurrentOptionIndex(prev => (prev - 1 + options.length) % options.length);
    };

    const handleNextOption = () => {
        if (isAnswered) return;
        setCurrentOptionIndex(prev => (prev + 1) % options.length);
    };

    // --- FUNGSI GLOBAL & HOOKS (Sebagian besar sama seperti Game Cocok) ---

    const endGame = useCallback((msg: string) => {
        setGameActive(false);
        setIsAnswered(true);


        if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);

        // Cari jawaban yang benar dan tampilkan
        if (options.length > 0) {
            const correctIndex = options.findIndex(opt => opt.isCorrect);
            if (correctIndex !== -1) {
                const newOptions = [...options];
                newOptions[correctIndex].status = 'correct'; // Beri latar hijau
                setOptions(newOptions);
                setCurrentOptionIndex(correctIndex); // Langsung arahkan ke jawaban benar
            }
        }

        const isGameOver = msg.includes("Waktu habis") || msg.includes("Nyawa habis");
        const title = isGameOver ? "Game Over" : "Selesai!";
        const timeBonus = isGameOver ? 0 : timer * difficultyScore[difficulty].timeBonus;
        const totalScore = score + timeBonus;

        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{msg}</p><hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    <span>Skor Jawaban</span><span className="text-right">{score}</span>
                    {!isGameOver && <span>Bonus Waktu</span>}
                    {!isGameOver && <span className="text-right">{timer} x {difficultyScore[difficulty].timeBonus} = {timeBonus}</span>}
                    <span className="font-bold">Total Skor</span><span className="text-right font-bold">{totalScore}</span>
                </div>
            </div>
        );

        setEndGameOverlay({ title, message: overlayMessage });
        setEndGameCardVisible(true);
    }, [difficulty, score, timer, options]);

    const currentOption = options.length > 0 ? options[currentOptionIndex] : null;
    let viewerClass = 'bg-gray-100 border-gray-300'; // Default
    if (currentOption?.status === 'correct') {
        viewerClass = 'bg-green-200 border-green-400 text-green-800';
    } else if (currentOption?.status === 'wrong') {
        viewerClass = 'bg-red-200 border-red-400 text-red-800';
    }

    const startGame = () => {
        setPreGameOverlayVisible(false);
        setEndGameOverlay(null);
        setScore(0);
        setTimer(DEFAULT_TIME);
        setLives(3);
        setCountdown(5);
        setCountdownActive(true);
        setTargetNumber('');
        setOptions([]);
        setBlinkPositions([]);
        setIsAnswered(false);
        // setFeedback({ text: '', type: '' });

        const countdownInterval = window.setInterval(() => {
            setCountdown(prev => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setCountdownActive(false);
                    setGameActive(true);
                    setupNewRound(difficulty);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        const param = searchParams.get("diff");
        setDifficulty(normalizeDifficulty(param));
    }, [searchParams]);

    useEffect(() => {
        let intervalId: number | undefined;
        if (gameActive) {
            intervalId = window.setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        endGame("⏰ Waktu habis!");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [gameActive, endGame]);

    // useEffect KHUSUS untuk interval kedip
    useEffect(() => {
        if (gameActive && !isAnswered) {
            blinkIntervalRef.current = setInterval(chooseBlinkPositions, 700);
        } else {
            if (blinkIntervalRef.current) {
                clearInterval(blinkIntervalRef.current);
            }
        }
        return () => {
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        };
    }, [gameActive, isAnswered, chooseBlinkPositions]);

    const formatTimer = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, "0")}:${Math.floor(secs % 60).toString().padStart(2, "0")}`;
    const renderLives = (lives: number) => Array.from({ length: 3 }, (_, i) => i < lives ? "❤️" : "🖤").join("");

    // --- JSX ---
    return (
        <main className="container mx-auto py-6 relative">
            {/* OVERLAY PRE-GAME & END-GAME (Sama seperti mode Cocok, bisa di-copy paste) */}
            {preGameOverlayVisible && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
                        <h2 className="text-4xl font-bold mb-4">Mode Kedip</h2>
                        <div className="mb-4 text-left space-y-2 text-sm">
                            <p>Digit angka akan berkedip sebagai petunjuk. Pilih jawaban terbilang yang benar menggunakan tombol Navigasi lalu Submit.</p>
                            <p>Kesulitan: <strong>{difficulty}</strong></p>
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={() => window.location.href = "/"} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl">Kembali</button>
                            <button onClick={startGame} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl">Mulai</button>
                        </div>
                    </div>
                </div>
            )}
            {countdownActive && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30"><div className="text-9xl text-white font-bold animate-pulse">{countdown}</div></div>}
            {endGameOverlay && (
                <div
                    className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-40 transition-opacity duration-500"
                    onClick={() => {
                        if (!endGameCardVisible) setEndGameCardVisible(true);
                    }}
                    onKeyDown={() => {
                        if (!endGameCardVisible) setEndGameCardVisible(true);
                    }}
                    tabIndex={0} // biar div bisa fokus & menangkap keydown
                >
                    {/* CARD */}
                    {endGameCardVisible && (
                        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full transform scale-90 opacity-0 animate-endgame-popup">
                            <h2 className="text-4xl font-bold mb-4">{endGameOverlay.title}</h2>
                            <div className="mb-6">{endGameOverlay.message}</div>
                            <div className="flex justify-center gap-4 flex-wrap">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
                                    onClick={() => window.location.href = "/home"}
                                >
                                    Kembali
                                </button>
                                <button
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-xl"
                                    onClick={() => setEndGameCardVisible(false)}
                                >
                                    Lihat
                                </button>
                                <button
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
                                    onClick={startGame}
                                >
                                    Main Lagi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TEKAN APA PUN */}
                    {!endGameCardVisible && (
                        <p className="mt-4 text-white text-lg animate-blink">
                            Tekan apapun untuk kembali...
                        </p>
                    )}
                </div>
            )}

            {/* MAIN INFO BAR */}
            <div className="flex justify-center items-center mb-3 font-bold bg-[#624b99] shadow-2xl rounded-2xl px-4 py-2 gap-16 w-[350px] mx-auto z-10">
                <div className="flex flex-col items-center"><span className="md:text-sm text-xs text-amber-300 leading-tight">Skor</span><span className="text-[#f7f4ff] leading-tight">{score}</span></div>
                <div className="flex flex-col items-center"><span className="md:text-sm text-xs text-amber-300 leading-tight">Waktu</span><span className="text-[#f7f4ff] leading-tight">{formatTimer(timer)}</span></div>
                <div className="flex flex-col items-center"><span className="md:text-sm text-xs text-amber-300 leading-tight">Nyawa</span><span className="text-[#f7f4ff] leading-tight">{renderLives(lives)}</span></div>
            </div>

            {/* SLOT DIGIT (TARGET DENGAN PETUNJUK) */}
            <NumberSlots
                digits={targetNumber ? targetNumber.split('') : []}
                orbitronClass={orbitron.className}
                difficulty={difficulty}
                activeIndices={blinkPositions} // Menggabungkan fixed dan blink
                revealDigits={isAnswered}
                countdownActive={countdownActive}
            />

            {/* AREA PEMILIHAN JAWABAN (Mekanisme Baru) */}
            <div className="lg:max-w-3xl md:max-w-2xl sm:max-w-lg max-w-sm mx-auto mt-6 flex flex-col items-center gap-4">
                {/* Option Viewer (Sekarang Jauh Lebih Bersih) */}
                <div className={`w-full p-4 rounded-xl shadow-md text-center font-semibold text-sm md:text-base min-h-[60px] flex items-center justify-center transition-colors duration-300 border-2 ${viewerClass}`}>
                    {currentOption ? currentOption.text : '-- Menunggu permainan dimulai --'}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-center gap-4">
                    <button onClick={handlePrevOption} disabled={isAnswered || !gameActive} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
                    <span className="font-bold text-white">{options.length > 0 ? `${currentOptionIndex + 1} / ${options.length}` : '0 / 0'}</span>
                    <button onClick={handleNextOption} disabled={isAnswered || !gameActive} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>

                {/* Submit Button */}
                <button onClick={handleSubmit} disabled={isAnswered || !gameActive} className="px-10 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    SUBMIT
                </button>
            </div>
        </main>
    );
}