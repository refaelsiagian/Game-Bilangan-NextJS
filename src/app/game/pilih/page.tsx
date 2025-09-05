"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/app/game/_context/GameContext"; // 👈 Impor useGame
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number";
import NumberSlots from "./NumberSlots"; // Pastikan path benar
import { gameData } from "@/config/game.config";


export default function GamePilih() {
    // 1. Ambil semua state dan fungsi dari context
    const { addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown } = useGame();
    const scoreDetail = gameData.cepat.find(m => m.path === 'pilih')?.difficulty[difficulty].score;

    // State yang tersisa adalah yang SPESIFIK untuk gameplay "Pilih"
    const [flashError, setFlashError] = useState(false);
    const [hasilTerbilang, setHasilTerbilang] = useState("");
    const [targetDigits, setTargetDigits] = useState<string[]>([]);
    const [filledSlots, setFilledSlots] = useState<{ [key: number]: string }>({});
    const [pendingDigits, setPendingDigits] = useState<string[]>([]);
    const [currentDigit, setCurrentDigit] = useState<string | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [correctDigitsCount, setCorrectDigitsCount] = useState(0);

    // Fungsi setup ronde tidak perlu lagi mereset skor, nyawa, dll.
    const setupNewRound = useCallback(() => {
        setIsGameFinished(false);
        setCorrectDigitsCount(0);
        const num = generateRandomNumberByDifficulty(difficulty);
        const digits = num.split('');

        setHasilTerbilang(terbilang(Number(num)));
        setTargetDigits(digits);

        let initialPending = [...digits];
        const initialFilled: { [key: number]: string } = {};

        if (difficulty === "mudah") {
            const fixedIndices = findFixedIndices(digits);
            fixedIndices.forEach(idx => {
                initialFilled[idx] = digits[idx];
            });
            initialPending = digits.filter((_, idx) => !fixedIndices.includes(idx));
        }

        if (difficulty === "sulit") {
            const allPossibleDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const availableDistractors = allPossibleDigits.filter(d => !digits.includes(d));
            for (let i = 0; i < 5 && availableDistractors.length > 0; i++) {
                const idx = Math.floor(Math.random() * availableDistractors.length);
                initialPending.push(availableDistractors.splice(idx, 1)[0]);
            }
        }

        shuffleArray(initialPending);
        setPendingDigits(initialPending);
        setCurrentDigit(initialPending.pop() ?? null);
        setFilledSlots(initialFilled);
    }, [difficulty]);

    // Fungsi ini menyiapkan pesan untuk overlay dan memanggil endGame dari context
    const handleEndGame = useCallback((title: string, message: string, isWin: boolean) => {
        if (isGameFinished) return; // Mencegah pemanggilan ganda
        setIsGameFinished(true);

        const finalCorrectCount = !isWin ? correctDigitsCount : difficulty == "mudah" ? 9 : 15;
        const pointsFromCorrect = finalCorrectCount * (scoreDetail?.correct ?? 0);
        const pointsCompleted = isWin ? (scoreDetail?.completed ?? 0) : 0;
        const pointsTimeBonus = isWin ? timer * (scoreDetail?.timeBonus ?? 0) : 0;
        const totalRoundScore = pointsFromCorrect + pointsCompleted + pointsTimeBonus;

        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{message}</p>
                <hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    {isWin && <>
                        <span>Selesai</span>
                        <span className="text-right">{pointsCompleted}</span>
                    </>}
                    <span>Digit Benar</span>
                    <span className="text-right">{finalCorrectCount} x {scoreDetail?.correct} = {pointsFromCorrect}</span>
                    {isWin && <>
                        <span>Bonus Waktu</span>
                        <span className="text-right">{timer} x {scoreDetail?.timeBonus} = {pointsTimeBonus}</span>
                    </>}
                    <span className="font-bold">Total Skor Ronde</span>
                    <span className="text-right font-bold">{totalRoundScore}</span>
                </div>
            </div>
        );

        endGame({ title, message: overlayMessage }); // Panggil endGame dari context
    }, [isGameFinished, correctDigitsCount, timer, endGame, scoreDetail, difficulty]);


    const handleSlotClick = (index: number) => {
        if (!gameActive || isGameFinished || filledSlots[index] || !currentDigit) return;

        if (targetDigits[index] === currentDigit) {
            // Jawaban benar
            const newFilledSlots = { ...filledSlots, [index]: currentDigit };
            setFilledSlots(newFilledSlots);
            addScore(scoreDetail?.correct ?? 0);
            setCorrectDigitsCount(prev => prev + 1); // State ini melacak aksi pemain

            const nextPending = [...pendingDigits];
            const nextDigit = nextPending.pop() ?? null;
            setCurrentDigit(nextDigit);
            setPendingDigits(nextPending);

            // --- PERUBAIKAN DI SINI ---
            // Tentukan target berdasarkan jumlah penempatan yang harus dilakukan pemain
            const requiredPlayerPlacements = difficulty === "mudah" ? 9 : 15;

            // Cek menggunakan `correctDigitsCount + 1` karena state update bersifat async.
            // Ini untuk langsung menghitung penempatan yang baru saja berhasil dilakukan.
            if (correctDigitsCount + 1 === requiredPlayerPlacements) {
                handleEndGame("Selamat!", "Anda menyelesaikan ronde ini.", true);
            }
            // --- AKHIR PERBAIKAN ---

        } else {
            // Jawaban salah
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
            loseLife({
                onGameOver: () => {
                    handleEndGame("Game Over", "Nyawa Anda habis.", false);
                }
            });
        }
    };

    const handleDiscard = () => {
        if (!gameActive || isGameFinished || !currentDigit || difficulty !== 'sulit') return;

        if (!targetDigits.includes(currentDigit)) {
            // Benar, ini adalah digit pengganggu
            const nextPending = [...pendingDigits];
            const nextDigit = nextPending.pop() ?? null;
            setCurrentDigit(nextDigit);
            setPendingDigits(nextPending);
        } else {
            // Salah, ini digit yang seharusnya dipakai
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
            loseLife({
                onGameOver: () => {
                    handleEndGame("Game Over", "Nyawa Anda habis.", false);
                }
            });
        }
    };

    // 3. Gunakan useEffect untuk bereaksi terhadap perubahan context
    useEffect(() => {
        if (gameActive) {
            setupNewRound();
        }
    }, [gameActive, setupNewRound]);

    useEffect(() => {
        if (timer <= 0 && gameActive) {
            handleEndGame("Waktu Habis!", "Waktu Anda telah habis.", false);
        }
    }, [timer, gameActive, handleEndGame]);

    useEffect(() => {
        if (isCountdown) {
            // Bersihkan papan saat countdown dimulai untuk 'Main Lagi'
            setHasilTerbilang("Bersiap...");
            setTargetDigits([]);
            setFilledSlots({});
            setPendingDigits([]);
            setCurrentDigit(null);
            setIsGameFinished(false);
        }
    }, [isCountdown]);

    // 4. Hapus semua JSX untuk overlay. Render hanya bagian gameplay.
    return (
        <div className="flex flex-col items-center">
            <NumberSlots
                digits={targetDigits}
                filledSlots={filledSlots}
                onSlotClick={handleSlotClick}
                difficulty={difficulty}
                countdownActive={isCountdown}
                displayLength={15}
                gameEnded={isGameFinished}
            />

            <div className="text-center mb-4 z-10">
                <div className={`border rounded-xl shadow-2xl p-3 min-h-[60px] min-w-[400px] sm:min-w-[600px] md:min-w-[750px] mx-auto transition ${flashError ? "bg-red-300" : "bg-[#faf8ff]"}`}>
                    <span className={isCountdown ? "text-gray-400" : ""}>
                        {isCountdown ? "Bersiap..." : hasilTerbilang}
                    </span>
                </div>
            </div>

            <div className="text-center mb-6 space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <span className="text-sm text-gray-500">Tempatkan Digit Ini</span>
                        <div className={`font-orbitron text-7xl font-bold text-blue-600 w-24 h-24 flex items-center justify-center`}>
                            {currentDigit ?? '_'}
                        </div>
                    </div>

                    {difficulty === "sulit" && gameActive && !isGameFinished && (
                        <button
                            onClick={handleDiscard}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl transition"
                        >
                            Buang
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}