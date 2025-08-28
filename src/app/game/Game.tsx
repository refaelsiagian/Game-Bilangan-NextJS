"use client";
import { useState, useEffect, useCallback } from "react";
import { Orbitron } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { terbilang, generateRandomNumberByDifficulty } from "@/utils/number";
import { JSX } from "react";

const orbitron = Orbitron({ subsets: ["latin"], weight: "500", variable: "--font-orbitron" });

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

const DEFAULT_TIME = 90; // detik (01:30). Ubah jika perlu.

export default function Game() {
    const searchParams = useSearchParams();

    const [kataArray, setKataArray] = useState<string[]>([]);
    const [targetNumber, setTargetNumber] = useState<string>("");
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState<number>(DEFAULT_TIME);
    const [gameActive, setGameActive] = useState(false);
    const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");
    const [flashError, setFlashError] = useState(false);
    const [lives, setLives] = useState(3); // default 3 nyawa
    const [highlightedAnswer, setHighlightedAnswer] = useState<JSX.Element | null>(null);
    const [endGameCardVisible, setEndGameCardVisible] = useState(true);
    const [preGameOverlayVisible, setPreGameOverlayVisible] = useState(true);




    // COUNTDOWN states (pre-start)
    const [countdown, setCountdown] = useState<number | null>(null); // 3,2,1 then null
    const [countdownActive, setCountdownActive] = useState(false);

    const normalizeDifficulty = (raw?: string | null) => {
        if (!raw) return "sedang";
        const v = raw.toLowerCase();
        if (v === "mudah" || v === "sedang" || v === "sulit") return v as "mudah" | "sedang" | "sulit";
        if (v === "easy") return "mudah";
        if (v === "hard") return "sulit";
        return "sedang";
    };

    const updateTargetNumber = (diff?: string) => {
        const useDiff = diff ? diff : difficulty;
        const num = generateRandomNumberByDifficulty(useDiff);
        setTargetNumber(num);
        setKataArray([]);
    };

    const [endGameOverlay, setEndGameOverlay] = useState<{
        title: string;
        message: string | JSX.Element;
    } | null>(null);

    // useCallback biar tidak perlu declare ulang tiap render (untuk dependency useEffect)
    const endGame = useCallback((msg: string) => {
        setGameActive(false);

        const jawabanUser = kataArray.join(" ").trim();
        const jawabanBenar = terbilang(Number(targetNumber));

        // Highlight jawaban
        if (jawabanUser.length > 0) {
            setHighlightedAnswer(highlightAnswer(jawabanUser, jawabanBenar));
        } else {
            setHighlightedAnswer(null);
        }

        const isGameOver = msg.includes("Waktu habis") || msg.includes("Nyawa habis") || msg.includes("Game diakhiri");
        const title = isGameOver ? "Game Over" : "Game Completed";

        // Hitung kata benar berturut-turut dari awal
        const userWords = jawabanUser.split(" ");
        const targetWords = jawabanBenar.split(" ");
        let matchedUntil = 0;
        for (let i = 0; i < userWords.length; i++) {
            if (userWords[i] !== targetWords[i]) break;
            matchedUntil++;
        }

        const scoreDetail = difficultyScore[difficulty];
        const pointsCorrect = matchedUntil * scoreDetail.correct;

        // Poin selesai & bonus waktu cuma kalau game berhasil (bukan game over)
        const pointsCompleted = !isGameOver ? scoreDetail.completed : 0;
        const pointsTimeBonus = !isGameOver ? timer * scoreDetail.timeBonus : 0;
        const totalPoints = pointsCompleted + pointsCorrect + pointsTimeBonus;

        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{msg}</p>
                <hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    {!isGameOver && <span>Selesai</span>}
                    {!isGameOver && <span className="text-right">{pointsCompleted}</span>}

                    <span>Kata Benar</span>
                    <span className="text-right">{matchedUntil} x {scoreDetail.correct} = {pointsCorrect}</span>

                    {!isGameOver && <span>Bonus Waktu</span>}
                    {!isGameOver && <span className="text-right">{timer} x {scoreDetail.timeBonus} = {pointsTimeBonus}</span>}

                    <span className="font-bold">Total Skor</span>
                    <span className="text-right font-bold">{totalPoints}</span>
                </div>
            </div>
        );

        setEndGameOverlay({
            title,
            message: overlayMessage
        });

        setScore(totalPoints);

        setEndGameCardVisible(true);
    }, [kataArray, targetNumber, timer, difficulty]);





    // Format timer mm:ss
    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = Math.floor(secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const highlightAnswer = (user: string, correct: string) => {
        const userWords = user.split(" ");
        const correctWords = correct.split(" ");

        let matchedUntil = userWords.length;
        for (let i = 0; i < userWords.length; i++) {
            if (userWords[i] !== correctWords[i]) {
                matchedUntil = i; // berhenti di kata yang salah
                break;
            }
        }

        return (
            <span>
                {userWords.map((word, i) => (
                    <span
                        key={i}
                        className={
                            i < matchedUntil
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                        }
                    >
                        {word}{" "}
                    </span>
                ))}
            </span>
        );
    };

    // START GAME
    const startGame = () => {
        setPreGameOverlayVisible(false); // sembunyikan pre-game overlay
        setCountdown(3);
        setCountdownActive(true);

        const cid = window.setInterval(() => {
            setCountdown(prev => {
                if (prev === null) return prev;
                if (prev <= 1) {
                    clearInterval(cid);
                    setCountdown(null);
                    setCountdownActive(false);

                    // Generate angka baru HANYA saat game mulai
                    updateTargetNumber();

                    setGameActive(true); // game baru mulai setelah countdown
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // MOUNT / QUERY PARAM EFFECT
    useEffect(() => {
        const param = searchParams.get("diff");
        const mapped = normalizeDifficulty(param);
        setDifficulty(mapped);

        // Reset state awal tapi jangan generate angka
        setScore(0);
        setTimer(DEFAULT_TIME);
        setGameActive(false);
        setKataArray([]);
        setLives(3);
        setHighlightedAnswer(null);
        setEndGameOverlay(null);
        setEndGameCardVisible(true);
        setPreGameOverlayVisible(true);
        setCountdown(null);
        setCountdownActive(false);

        // Tidak memanggil updateTargetNumber() di sini

        // Cleanup countdown jika ada
        return () => { };
    }, [searchParams]);


    // Timer effect
    useEffect(() => {
        let intervalId: number | undefined;
        if (gameActive) {
            intervalId = window.setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        endGame("⏰ Waktu habis! Jawaban benar: " + terbilang(Number(targetNumber)));
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (intervalId !== undefined) clearInterval(intervalId);
        };
    }, [gameActive, targetNumber, endGame]);

    // state baru

    const handleSubmit = () => {
        if (!gameActive) return;
        const jawabanUser = kataArray.join(" ").trim();
        const jawabanBenar = terbilang(Number(targetNumber));

        if (jawabanUser === jawabanBenar) {
            setScore(prev => prev + 10);
            endGame("✅ Benar! Permainan selesai.");
        } else {
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300); // reset setelah 300ms

            setLives(prev => {
                if (prev <= 1) {
                    endGame("💀 Nyawa habis! Jawaban benar: " + jawabanBenar);
                    return 0;
                }
                return prev - 1;
            });
        }
    };


    const renderLives = (lives: number) => {
        const total = 3;
        return Array.from({ length: total }, (_, i) =>
            i < lives ? "❤️" : "🖤"
        ).join("");
    };


    function formatWithDotsOrPlaceholder(num: string, length = 15) {
        // kalau countdown aktif, tampilkan placeholder '_' (target tersembunyi)
        if (countdownActive) {
            const placeholderDigits = Array.from({ length }, () => "_");
            for (let i = placeholderDigits.length - 3; i > 0; i -= 3) {
                placeholderDigits.splice(i, 0, ".");
            }
            return placeholderDigits;
        }

        if (num) {
            return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".").split("");
        } else {
            const placeholderDigits = Array.from({ length }, () => "_");
            for (let i = placeholderDigits.length - 3; i > 0; i -= 3) {
                placeholderDigits.splice(i, 0, ".");
            }
            return placeholderDigits;
        }
    }

    const angkaDasar = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
    const satuan = ["puluh", "belas", "ratus", "ribu", "juta", "miliar", "triliun"];
    const khusus = ["sepuluh", "sebelas", "seratus", "seribu"];

    return (
        <main className="container mx-auto py-6 relative">

            {preGameOverlayVisible && (
                <div
                    className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 transition-opacity duration-500"
                    tabIndex={0}
                >
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full transform scale-90 opacity-0 animate-endgame-popup">
                        <h2 className="text-4xl font-bold mb-4">Tulis</h2>
                        <div className="mb-4 text-left space-y-2 text-sm">
                            <p>Terdapat bilangan 15 digit yang akan muncul dan juga papan angka yang berisi tombol angka secara terbilang, satuannya, dan terbilang khusus.</p>
                            <p>Gunakan tombol-tombol tersebut untuk merangkai terbilang dari bilangan secara utuh.</p>
                            <p>Kesulitan: <strong>{difficulty}</strong></p>
                            <p>Hanya akan ada 3 tripel digit yang berisi angka, sisanya berisi 0</p>
                            <hr className="my-2" />
                            <div className="grid grid-cols-2 gap-x-4">
                                <span>Selesai</span>
                                <span className="text-right">{difficultyScore[difficulty].completed}</span>

                                <span>Kata Benar</span>
                                <span className="text-right">x{difficultyScore[difficulty].correct}</span>

                                <span>Bonus Waktu</span>
                                <span className="text-right">x{difficultyScore[difficulty].timeBonus}</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 flex-wrap">
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
                                onClick={() => window.location.href = "/home"}
                            >
                                Kembali
                            </button>
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
                                onClick={startGame}
                            >
                                Mulai
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* main info bar */}
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

            {/* target number */}
            <div className="text-center mb-4 relative z-10">
                <div className={`${orbitron.className} font-orbitron target-number-box`}>
                    {formatWithDotsOrPlaceholder(targetNumber).map((d, i) => (
                        <span
                            key={i}
                            className={`h-8 sm:h-10 md:h-12 lg:h-13 flex items-center justify-center rounded shadow-inner
                                ${d === "." ? "target-separator" : "target-digit"}`
                            }
                        >
                            {d}
                        </span>
                    ))}
                </div>
            </div>

            {/* jawaban box */}
            <div className="text-center mb-4 z-10">
                <div
                    className={`border rounded-xl shadow-2xl p-3 min-h-[60px] max-w-[400px] sm:max-w-[600px] md:max-w-[750px] mx-auto transition 
                                ${flashError ? "bg-red-400" : "bg-[#faf8ff]"}`}
                >
                    <span className={kataArray.length === 0 ? "text-gray-400" : ""}>
                        {highlightedAnswer
                            ? highlightedAnswer
                            : kataArray.length === 0
                                ? (countdownActive ? "Bersiap..." : "Gunakan tombol di bawah untuk membentuk jawaban")
                                : kataArray.join(" ")}
                    </span>

                </div>
            </div>

            {/* Control Buttons */}
            <div className="text-center mb-6 z-10">
                <button
                    className="bg-amber-400 hover:bg-amber-500 px-4 py-2 rounded-xl mr-2 transition"
                    onClick={() => setKataArray(prev => prev.slice(0, -1))}
                    disabled={countdownActive}
                >
                    Hapus
                </button>
                <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
                    onClick={() => { setKataArray([]); }}
                    disabled={countdownActive}
                >
                    Reset
                </button>
                <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl ml-2 transition"
                    onClick={handleSubmit}
                    disabled={countdownActive}
                >
                    Submit
                </button>
            </div>

            {/* Word Boards */}
            <div className="grid grid-cols-12 gap-4 mb-6 lg:max-w-[800px] md:max-w-[650px] sm:max-w-[500px] max-w-[350px] mx-auto z-10">
                <div className="col-span-12 md:col-span-5 bg-blue-50 rounded-lg p-4">
                    <h5 className="text-center mb-2 font-semibold">Angka Dasar</h5>
                    <div className="grid grid-cols-3 gap-2">
                        {angkaDasar.map((word, i) => (
                            <button
                                key={i}
                                className="px-2 py-2 rounded bg-theme-purple-300 hover:bg-theme-purple-350 w-full shadow-inner"
                                onClick={() => setKataArray((prev) => [...prev, word])}
                                disabled={countdownActive}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-8 md:col-span-4 bg-gray-50 rounded-lg p-4">
                    <h5 className="text-center mb-2 font-semibold">Satuan</h5>
                    <div className="grid grid-cols-2 gap-2">
                        {satuan.map((word, i) => (
                            <button
                                key={i}
                                className="px-2 py-2 rounded bg-theme-purple-300 hover:bg-theme-purple-350 w-full shadow-inner"
                                onClick={() => setKataArray((prev) => [...prev, word])}
                                disabled={countdownActive}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-4 md:col-span-3 bg-yellow-50 rounded-lg p-4">
                    <h5 className="text-center mb-2 font-semibold">Khusus</h5>
                    <div className="grid grid-cols-1 gap-2">
                        {khusus.map((word, i) => (
                            <button
                                key={i}
                                className="px-2 py-2 rounded bg-theme-purple-300 hover:bg-theme-purple-350 w-full shadow-inner"
                                onClick={() => setKataArray((prev) => [...prev, word])}
                                disabled={countdownActive}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* COUNTDOWN OVERLAY */}
            {countdownActive && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-30">
                    <div className="text-center text-white">
                        <div className="text-md opacity-90">Bersiap... Game dimulai dalam</div>
                        <div className="text-[6rem] sm:text-[8rem] leading-none font-bold animate-pulse">
                            {countdown}
                        </div>
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
                                    onClick={() => {
                                        setEndGameCardVisible(false); // sembunyikan card
                                        setCountdown(3);
                                        setCountdownActive(true);
                                        setEndGameOverlay(null); // reset overlay
                                        setKataArray([]);
                                        setScore(0);
                                        setTimer(DEFAULT_TIME);
                                        setLives(3);
                                        setHighlightedAnswer(null);

                                        // start countdown
                                        const cid = window.setInterval(() => {
                                            setCountdown(prev => {
                                                if (prev === null) return prev;
                                                if (prev <= 1) {
                                                    clearInterval(cid);
                                                    setCountdown(null);
                                                    setCountdownActive(false);
                                                    setGameActive(true);
                                                    updateTargetNumber();
                                                    return 0;
                                                }
                                                return prev - 1;
                                            });
                                        }, 1000);
                                    }}
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
        </main>
    );
}
