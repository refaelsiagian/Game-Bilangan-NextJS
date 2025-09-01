"use client";
import { useState, useEffect, useCallback } from "react";
import { Orbitron } from "next/font/google";
import { useSearchParams } from "next/navigation";
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number"; // Pastikan path utilitas benar
import { JSX } from "react";

import NumberSlots from "@/components/NumberSlot";

const orbitron = Orbitron({ subsets: ["latin"], weight: "500", variable: "--font-orbitron" });

// Skor disesuaikan per ronde yang benar
const difficultyScore = {
    mudah: {
        completed: 100, // Bonus jika game tidak dihentikan (opsional)
        correct: 15,    // Poin per jawaban benar
        timeBonus: 1,
    },
    sedang: {
        completed: 200,
        correct: 25,
        timeBonus: 2,
    },
    sulit: {
        completed: 300,
        correct: 35,
        timeBonus: 3,
    }
};

const DEFAULT_TIME = 120;

export default function Cocokk() {
    const searchParams = useSearchParams();

    // State global game
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState<number>(DEFAULT_TIME);
    const [lives, setLives] = useState(3);
    const [gameActive, setGameActive] = useState(false);
    const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");

    // State spesifik untuk gameplay "Cocok"
    const [targetNumber, setTargetNumber] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ [key: string]: 'correct' | 'wrong' }>({});
    const [answered, setAnswered] = useState(false);
    const [correctRounds, setCorrectRounds] = useState(0);
    const [hintIndices, setHintIndices] = useState<number[]>([]);
    const [revealDigits, setRevealDigits] = useState<boolean>(false);

    // State untuk UI (overlay, countdown, dll)
    const [endGameOverlay, setEndGameOverlay] = useState<{ title: string; message: string | JSX.Element; } | null>(null);
    const [preGameOverlayVisible, setPreGameOverlayVisible] = useState(true);
    const [endGameCardVisible, setEndGameCardVisible] = useState(true);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [countdownActive, setCountdownActive] = useState(false);

    const normalizeDifficulty = (raw?: string | null) => {
        if (!raw) return "sedang";
        const v = raw.toLowerCase();
        if (v === "mudah" || v === "sedang" || v === "sulit") return v as "mudah" | "sedang" | "sulit";
        return "sedang";
    };

    // --- LOGIKA SPESIFIK GAME COCOK ---

    const createWrongOption = useCallback((
        currentDifficulty: "mudah" | "sedang" | "sulit",
        currentTargetNumber: string,
        hintPositions: number[]
    ) => {
        let wrongDigits: string[] = [];
        let candidateTriples: number[] = [];
        const targetDigits = currentTargetNumber.split("");
        const targetTriples = findFixedIndices(targetDigits);

        // Dapatkan fixedIndices dari jawaban yang BENAR
        const fixedIndices = findFixedIndices(targetDigits);

        do {
            const candidate = generateRandomNumberByDifficulty(currentDifficulty);
            if (candidate === currentTargetNumber) continue;

            wrongDigits = candidate.split("");
            candidateTriples = findFixedIndices(wrongDigits);
        } while (!triplesMatch(targetTriples, candidateTriples));

        hintPositions.forEach(pos => {
            if (pos < wrongDigits.length && pos < currentTargetNumber.length) {
                wrongDigits[pos] = currentTargetNumber[pos];
            }
        });

        // 🔽🔽🔽 UBAH BARIS PEMANGGILAN INI 🔽🔽🔽
        // Sekarang kita teruskan `fixedIndices` ke dalam fungsi
        const { posToSwap, swapPos } = pickSwapPositions(hintPositions, wrongDigits, fixedIndices);

        // Lakukan penukaran hanya jika posisi yang dikembalikan valid
        if (posToSwap !== -1 && swapPos !== -1) {
            [wrongDigits[posToSwap], wrongDigits[swapPos]] = [wrongDigits[swapPos], wrongDigits[posToSwap]];
        }

        return wrongDigits.join("");

        // Helper functions (triplesMatch, etc.) tetap di sini...
        // ...
    }, []);

    // Helper function di dalam useCallback atau di luar komponen

    function pickSwapPositions(
        hintPositionsLocal: number[],
        digits: string[],
        fixedIndices: number[]
    ) {
        // 1. Gabungkan semua index yang "terlarang" untuk menjadi tujuan swap.
        // Index terlarang adalah fixed index atau hint index lainnya.
        // Menggunakan Set jauh lebih cepat untuk pengecekan.
        const forbiddenIndices = new Set([...fixedIndices, ...hintPositionsLocal]);

        // 2. Acak urutan hint agar tidak monoton saat mencari posisi.
        const shuffledHints = [...hintPositionsLocal].sort(() => 0.5 - Math.random());

        // 3. PRIORITAS UTAMA: Coba tukar setiap hint dengan tetangga yang aman.
        for (const posToSwap of shuffledHints) {
            const possibleDestinations: number[] = [];
            const leftPos = posToSwap - 1;
            const rightPos = posToSwap + 1;

            // Cek tetangga kiri: apakah valid dan "aman"?
            if (leftPos >= 0 && !forbiddenIndices.has(leftPos)) {
                possibleDestinations.push(leftPos);
            }

            // Cek tetangga kanan: apakah valid dan "aman"?
            if (rightPos < digits.length && !forbiddenIndices.has(rightPos)) {
                possibleDestinations.push(rightPos);
            }

            // Jika ditemukan tetangga yang aman (satu atau dua),
            // pilih salah satu secara acak dan langsung kembalikan hasilnya.
            if (possibleDestinations.length > 0) {
                const swapPos = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
                return { posToSwap, swapPos };
            }
        }

        // 4. FALLBACK (Jaring Pengaman): Jika tidak ada hint yang bisa ditukar dengan tetangganya.
        // (misalnya semua hint berdempetan atau dikelilingi fixed index)
        // Lakukan penukaran umum seperti solusi saya sebelumnya.
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

    const setupNewRound = useCallback((currentDifficulty: "mudah" | "sedang" | "sulit") => {
        setFeedback({});
        setAnswered(false);
        setRevealDigits(false); // Reset reveal setiap ronde baru

        const num = generateRandomNumberByDifficulty(currentDifficulty);
        const digits = num.split('');
        const hintCount = currentDifficulty === "mudah" ? 3 : 5;

        // -- Ambil fixedIndices jika mode mudah --
        const fixedIndices = currentDifficulty === "mudah" ? findFixedIndices(digits) : [];

        // -- Daftar index yang tersedia (exclude fixedIndices) --
        const availableIndices = digits.map((_, i) => i).filter(i => !fixedIndices.includes(i));

        // -- Pilih posisi hint secara acak --
        const currentHintPositions: number[] = [];
        while (currentHintPositions.length < hintCount && availableIndices.length > 0) {
            const randIdx = Math.floor(Math.random() * availableIndices.length);
            const nextPos = availableIndices[randIdx];

            // -- Untuk mode sulit, hindari posisi yang berdekatan --
            const isClose = currentDifficulty === "sulit" ? currentHintPositions.some(existing => Math.abs(existing - nextPos) <= 1) : false;
            if (!isClose) {
                currentHintPositions.push(nextPos);
                availableIndices.splice(randIdx, 1);
            }
        }

        setHintIndices(currentHintPositions);

        const correctAnswerText = terbilang(Number(num));

        // Buat opsi (1 benar + 3 salah)
        const currentOptions = [correctAnswerText];
        while (currentOptions.length < 4) {
            const wrongNum = createWrongOption(currentDifficulty, num, currentHintPositions);
            const wrongText = terbilang(Number(wrongNum));
            if (!currentOptions.includes(wrongText)) {
                currentOptions.push(wrongText);
            }
        }

        setTargetNumber(num);
        setOptions(shuffleArray(currentOptions));
        setCorrectAnswer(correctAnswerText);
    }, [createWrongOption]);


    // Logika utama saat tombol pilihan diklik
    const handleOptionClick = (selectedOption: string) => {
        if (!gameActive || answered) return;

        setAnswered(true);
        setRevealDigits(true);
        const isCorrect = selectedOption === correctAnswer;

        if (isCorrect) {
            setScore(prev => prev + difficultyScore[difficulty].correct);
            setCorrectRounds(prev => prev + 1);
            setFeedback({ [selectedOption]: 'correct' });

            // Lanjut ke pertanyaan berikutnya setelah jeda
            setTimeout(() => {
                if (gameActive) { // Pastikan game masih aktif
                    setupNewRound(difficulty);
                }
            }, 1200);

        } else {

            setFeedback({
                [selectedOption]: 'wrong',
                [correctAnswer]: 'correct'
            });

            setLives(prev => {
                if (prev <= 1) {
                    endGame("💀 Nyawa habis!");
                    return 0;
                }
                // Lanjut setelah jeda meskipun salah
                setTimeout(() => {
                    if (gameActive) setupNewRound(difficulty);
                }, 1200);
                return prev - 1;
            });
        }
    };


    // --- FUNGSI GLOBAL & HOOKS (Sama seperti GamePilih) ---

    const endGame = useCallback((msg: string) => {
        setGameActive(false);
        const isGameOver = msg.includes("Waktu habis") || msg.includes("Nyawa habis");
        const title = isGameOver ? "Game Over" : "Selesai!";

        const scoreDetail = difficultyScore[difficulty];
        const timeBonus = isGameOver ? 0 : timer * scoreDetail.timeBonus;
        const totalScore = score + timeBonus;

        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{msg}</p>
                <hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    <span>Benar</span>
                    <span className="text-right">
                        {correctRounds} x {scoreDetail.correct} = {correctRounds * scoreDetail.correct}
                    </span>

                    {!isGameOver && <span>Bonus Waktu</span>}
                    {!isGameOver && (
                        <span className="text-right">
                            {timer} x {scoreDetail.timeBonus} = {timeBonus}
                        </span>
                    )}

                    <span className="font-bold">Total Skor</span>
                    <span className="text-right font-bold">{totalScore}</span>
                </div>
            </div>
        );

        setEndGameOverlay({ title, message: overlayMessage });
        setEndGameCardVisible(true);
    }, [difficulty, score, timer, correctRounds]);

    const startGame = () => {
        setPreGameOverlayVisible(false);
        setEndGameOverlay(null);
        setEndGameCardVisible(false);
        setScore(0);
        setTimer(DEFAULT_TIME);
        setLives(3);
        setCorrectRounds(0);
        setCountdown(5);
        setCountdownActive(true);
        setTargetNumber('');
        setOptions([]);
        setCorrectAnswer('');

        // 🔽🔽🔽 TAMBAHKAN DUA BARIS PENTING INI 🔽🔽🔽
        setHintIndices([]);     // <-- Reset data hint
        setRevealDigits(false); // <-- Reset data pembuka digit

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
        const mapped = normalizeDifficulty(param);
        setDifficulty(mapped);
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


    // --- RENDER HELPER ---
    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = Math.floor(secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const renderLives = (lives: number) => Array.from({ length: 3 }, (_, i) => i < lives ? "❤️" : "🖤").join("");

    // --- JSX ---
    return (
        <main className="container mx-auto py-6 relative">

            {/* OVERLAY PRE-GAME */}
            {preGameOverlayVisible && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full animate-endgame-popup">
                        <h2 className="text-4xl font-bold mb-4">Cocokkan</h2>
                        <div className="mb-4 text-left space-y-2 text-sm">
                            <p>Sebuah angka akan ditampilkan dengan beberapa digit sebagai petunjuk.</p>
                            <p>Pilih jawaban terbilang yang benar dari empat pilihan yang tersedia.</p>
                            <p>Kesulitan: <strong>{difficulty}</strong></p>
                            <hr className="my-2" />
                            <div className="grid grid-cols-2 gap-x-4">
                                <span>Poin per Benar</span>
                                <span className="text-right">x{difficultyScore[difficulty].correct}</span>
                                <span>Bonus Waktu</span>
                                <span className="text-right">x{difficultyScore[difficulty].timeBonus}</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={() => window.location.href = "/"} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl">Kembali</button>
                            <button onClick={startGame} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl">Mulai</button>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY COUNTDOWN & END-GAME (Tidak diubah, sama seperti GamePilih) */}
            {countdownActive && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
                    <div className="text-9xl text-white font-bold animate-pulse">
                        {countdown}
                    </div>
                </div>
            )}

            {/* ENDGAME OVERLAY */}
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
                <div className="flex flex-col items-center">
                    <span className="md:text-sm text-xs text-amber-300 leading-tight">Skor</span>
                    <span className="text-[#f7f4ff] leading-tight">{score}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="md:text-sm text-xs text-amber-300 leading-tight">Waktu</span>
                    <span className="text-[#f7f4ff] leading-tight">{formatTimer(timer)}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="md:text-sm text-xs text-amber-300 leading-tight">Nyawa</span>
                    <span className="text-[#f7f4ff] leading-tight">{renderLives(lives)}</span>
                </div>
            </div>

            {
                console.log(targetNumber ? targetNumber.split('') : [])
            }

            {/* SLOT DIGIT (TARGET DENGAN PETUNJUK) */}
            <NumberSlots
                digits={targetNumber ? targetNumber.split('') : []}
                difficulty={difficulty}
                orbitronClass={orbitron.className}
                displayLength={15}
                hintIndices={hintIndices}
                revealDigits={revealDigits}
                countdownActive={countdownActive} // <-- KRUSIAL: Tambahkan ini
            />

            {/* AREA PEMILIHAN JAWABAN */}
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
                            disabled={answered}
                            className={`p-4 rounded-xl shadow-md text-center transition-all duration-300 text-sm md:text-base font-semibold border-2 ${feedbackClass} ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

        </main>
    );
}