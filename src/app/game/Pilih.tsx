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

// di bagian import atas GamePilih
import NumberSlots from "@/components/NumberSlots";

const orbitron = Orbitron({ subsets: ["latin"], weight: "500", variable: "--font-orbitron" });

// Skor disesuaikan per digit yang benar
const difficultyScore = {
    mudah: {
        completed: 100,
        correct: 5,
        timeBonus: 1, // per detik
    },
    sedang: {
        completed: 200,
        correct: 10,
        timeBonus: 2, // per detik
    },
    sulit: {
        completed: 300,
        correct: 15,
        timeBonus: 3, // per detik
    }
};

const DEFAULT_TIME = 120; // Waktu bisa disesuaikan untuk mode ini

export default function GamePilih() {
    const searchParams = useSearchParams();

    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState<number>(DEFAULT_TIME);
    const [lives, setLives] = useState(3);
    const [gameActive, setGameActive] = useState(false);
    const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");
    const [flashError, setFlashError] = useState(false); // Untuk animasi flash merah

    // State spesifik untuk gameplay "Pilih"
    const [hasilTerbilang, setHasilTerbilang] = useState("Klik 'Mulai' untuk bermain...");
    const [targetDigits, setTargetDigits] = useState<string[]>([]);
    const [filledSlots, setFilledSlots] = useState<{ [key: number]: string }>({});
    const [pendingDigits, setPendingDigits] = useState<string[]>([]);
    const [currentDigit, setCurrentDigit] = useState<string | null>(null);
    const [correct, setCorrect] = useState(0);

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

    // Fungsi untuk menyiapkan ronde baru
    const setupNewRound = useCallback((currentDifficulty: "mudah" | "sedang" | "sulit") => {
        const num = generateRandomNumberByDifficulty(currentDifficulty);
        const digits = num.split('');

        setHasilTerbilang(terbilang(Number(num)));
        setTargetDigits(digits);

        // Siapkan pendingDigits
        let initialPending = [...digits];
        const initialFilled: { [key: number]: string } = {};

        // Mode Mudah: beberapa digit sudah terisi
        if (currentDifficulty === "mudah") {
            const fixedIndices = findFixedIndices(digits);
            fixedIndices.forEach(idx => {
                initialFilled[idx] = digits[idx];
            });
            initialPending = digits.filter((_, idx) => !fixedIndices.includes(idx));
        }

        // Mode Sulit: tambahkan digit pengganggu
        if (currentDifficulty === "sulit") {
            const allPossibleDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const availableDistractors = allPossibleDigits.filter(d => !digits.includes(d));
            for (let i = 0; i < 5 && availableDistractors.length > 0; i++) {
                const idx = Math.floor(Math.random() * availableDistractors.length);
                initialPending.push(availableDistractors.splice(idx, 1)[0]);
            }
        }

        shuffleArray(initialPending);

        setPendingDigits(initialPending);
        setCurrentDigit(initialPending.pop() ?? null); // Ambil digit pertama
        setFilledSlots(initialFilled);
        setScore(0);
        setLives(3);
        setTimer(DEFAULT_TIME);

    }, []);

    const endGame = useCallback((msg: string) => {
        setGameActive(false);
        const isGameOver = msg.includes("Waktu habis") || msg.includes("Nyawa habis");
        const title = isGameOver ? "Game Over" : "Selamat!";

        const scoreDetail = difficultyScore[difficulty];
        const digitCorrect = isGameOver ? correct : difficulty == "mudah" ? 9 : 15; // Asumsi 15 digit per ronde
        const pointsCompleted = isGameOver ? 0 : scoreDetail.completed;
        const timeBonus = isGameOver ? 0 : timer * scoreDetail.timeBonus;
        const totalScore = score + timeBonus + pointsCompleted;


        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{msg}</p>
                <hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    {!isGameOver && <span>Selesai</span>}
                    {!isGameOver && <span className="text-right">{pointsCompleted}</span>}

                    <span>Digit Benar</span>
                    <span className="text-right">
                        {digitCorrect} x {scoreDetail.correct} = {digitCorrect * scoreDetail.correct}
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
    }, [difficulty, score, timer, correct]);


    // Logika utama saat slot digit diklik
    const handleSlotClick = (index: number) => {
        if (!gameActive || filledSlots[index] || !currentDigit) return;

        if (targetDigits[index] === currentDigit) {
            // Jawaban benar
            const newFilledSlots = { ...filledSlots, [index]: currentDigit };
            setFilledSlots(newFilledSlots);
            setScore(prev => prev + difficultyScore[difficulty].correct);

            const nextPending = [...pendingDigits];
            const nextDigit = nextPending.pop() ?? null;
            setCurrentDigit(nextDigit);
            setPendingDigits(nextPending);
            setCorrect(prev => prev + 1);

            if (Object.keys(newFilledSlots).length === targetDigits.length) {
                // Semua slot terisi dengan benar
                endGame("🎉 Selamat! Anda menyelesaikan ronde ini.");
            }

        } else {
            // Jawaban salah
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
            setLives(prev => {
                if (prev <= 1) {
                    endGame("💀 Nyawa habis!");
                    return 0;
                }
                return prev - 1;
            });
        }
    };

    // Logika untuk tombol "Buang" (mode sulit)
    const handleDiscard = () => {
        if (!gameActive || !currentDigit || difficulty !== 'sulit') return;

        if (!targetDigits.includes(currentDigit)) {
            // Benar, ini adalah digit pengganggu
            const nextPending = [...pendingDigits];
            const nextDigit = nextPending.pop() ?? null;
            setCurrentDigit(nextDigit);
            setPendingDigits(nextPending);
        } else {
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
            // Salah, ini digit yang seharusnya dipakai
            setLives(prev => {
                if (prev <= 1) {
                    endGame("💀 Nyawa habis!");
                    return 0;
                }
                return prev - 1;
            });
        }
    };

    // --- HOOKS ---

    // Inisialisasi game berdasarkan URL
    useEffect(() => {
        const param = searchParams.get("diff");
        const mapped = normalizeDifficulty(param);
        setDifficulty(mapped);

        // Reset semua state ke awal
        setGameActive(false);
        setPreGameOverlayVisible(true);
        setEndGameOverlay(null);
        setCountdown(null);
        setCountdownActive(false);
        setScore(0);
        setTimer(DEFAULT_TIME);
        setLives(3);
    }, [searchParams]);

    // Countdown untuk memulai game
    const startGame = () => {
        setPreGameOverlayVisible(false);
        setEndGameOverlay(null);
        setEndGameCardVisible(false);
        setScore(0);
        setTimer(DEFAULT_TIME);
        setLives(3);
        setCountdown(3);
        setCountdownActive(true);
        setCurrentDigit(null);

        // 🔑 reset isi lama
        setFilledSlots({});
        setTargetDigits([]);
        setPendingDigits([]);
        setCorrect(0);

        const countdownInterval = window.setInterval(() => {
            setCountdown(prev => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setCountdownActive(false);
                    setGameActive(true);
                    setupNewRound(difficulty); // Siapkan ronde setelah countdown
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Timer utama game
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
                        <h2 className="text-4xl font-bold mb-4">Pilih & Tempatkan</h2>
                        <div className="mb-4 text-left space-y-2 text-sm">
                            <p>Seluruh slot digit di papan angka kosong. Di bawahnya terdapat satu digit angka yang muncul acak</p>
                            <p>Pilih slot yang tepat untuk setiap digit angka yang muncul berdasarkan terbilangnya.</p>
                            <p>Kesulitan: <strong>{difficulty}</strong></p>
                            <p>Tempatkan setiap digit yang muncul di slot yang benar.</p>
                            <hr className="my-2" />
                            <div className="grid grid-cols-2 gap-x-4">
                                <span>Selesai</span>
                                <span className="text-right">{difficultyScore[difficulty].completed}</span>
                                <span>Poin per Digit</span>
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

            {/* OVERLAY COUNTDOWN */}
            {countdownActive && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-30">
                    <div className="text-center text-white">
                        <div className="text-md opacity-90">Bersiap...</div>
                        <div className="text-[8rem] leading-none font-bold animate-pulse">{countdown}</div>
                    </div>
                </div>
            )}

            {/* OVERLAY END-GAME */}
            {/* CARD */}
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
            <div className="flex justify-center items-center mb-3 font-bold bg-[#624b99] shadow-2xl rounded-2xl px-4 py-2 gap-16 w-[400px] mx-auto z-10">
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


            {/* SLOT DIGIT (TARGET) */}
            <NumberSlots
                digits={targetDigits}
                filledSlots={filledSlots}
                onSlotClick={handleSlotClick}
                difficulty={difficulty}
                orbitronClass={orbitron.className}
                countdownActive={countdownActive}
                displayLength={15}
                gameEnded={!gameActive && endGameOverlay !== null} // 👈 kirim state endgame
            />



            {/* HASIL TERBILANG (PETUNJUK) */}
            <div className="text-center mb-4 z-10">
                <div
                    className={`border rounded-xl shadow-2xl p-3 min-h-[60px] max-w-[400px] sm:max-w-[600px] md:max-w-[750px] mx-auto transition 
                                ${flashError ? "bg-red-300" : "bg-[#faf8ff]"}`}
                >
                    <span className={countdownActive ? "text-gray-400" : ""}>
                        {countdownActive ? "Bersiap..." : hasilTerbilang}
                    </span>

                </div>
            </div>

            {/* CURRENT DIGIT & DISCARD BUTTON */}
            <div className="text-center mb-6 space-y-4">
                <div className="flex flex-col items-center gap-4">
                    {/* Kotak angka */}
                    <div className="flex flex-col items-center bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <span className="text-sm text-gray-500">Tempatkan Digit Ini</span>
                        <div
                            className={`${orbitron.className} text-7xl font-bold text-blue-600 w-24 h-24 flex items-center justify-center`}
                        >
                            {currentDigit ?? '_'}
                        </div>
                    </div>

                    {/* Tombol di bawah */}
                    {difficulty === "sulit" && gameActive && (
                        <button
                            onClick={handleDiscard}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl transition"
                        >
                            Buang
                        </button>
                    )}
                </div>
            </div>



        </main>
    );
}