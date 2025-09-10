"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import {
    terbilang,
    generateRandomNumberByDifficulty,
    shuffleArray,
    findFixedIndices
} from "@/utils/number";
import NumberSlots from "./NumberSlots";
import { gameData } from "@/config/game.config";

export default function GamePilih() {
    // ✨ 1. Ambil 'lives' dan 'setOnTimeUpCallback' dari context
    const { lives, addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown, setOnTimeUpCallback } = useGame();
    const scoreDetail = gameData.cepat.find(m => m.path === 'pilih')?.difficulty[difficulty].score;

    // State lokal tidak berubah
    const [flashError, setFlashError] = useState(false);
    const [hasilTerbilang, setHasilTerbilang] = useState("");
    const [targetDigits, setTargetDigits] = useState<string[]>([]);
    const [filledSlots, setFilledSlots] = useState<{ [key: number]: string }>({});
    const [pendingDigits, setPendingDigits] = useState<string[]>([]);
    const [currentDigit, setCurrentDigit] = useState<string | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [correctDigitsCount, setCorrectDigitsCount] = useState(0);

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
    
    // ✨ 2. Pindahkan logika skor total ke dalam handleEndGame
    const handleEndGame = useCallback((title: string, message: string, isWin: boolean) => {
        if (isGameFinished) return;
        setIsGameFinished(true);

        const finalCorrectCount = !isWin ? correctDigitsCount : (difficulty === "mudah" ? 9 : 15);
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

        endGame({ title, message: overlayMessage });
    }, [isGameFinished, correctDigitsCount, timer, endGame, scoreDetail, difficulty]);

    // ✨ 3. Buat "surat instruksi" untuk Boss jika waktu habis
    const handleTimeUp = useCallback(() => {
        handleEndGame("Waktu Habis!", "Waktu Anda telah habis.", false);
    }, [handleEndGame]);

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
            handleEndGame("Game Over", "Nyawa Anda habis.", false);
        }
    }, [lives, gameActive, handleEndGame]);


    const handleSlotClick = (index: number) => {
        if (!gameActive || isGameFinished || filledSlots[index] || !currentDigit) return;

        if (targetDigits[index] === currentDigit) {
            // Jawaban benar
            const newFilledSlots = { ...filledSlots, [index]: currentDigit };
            setFilledSlots(newFilledSlots);
            addScore(scoreDetail?.correct ?? 0);
            setCorrectDigitsCount(prev => prev + 1);

            const nextPending = [...pendingDigits];
            const nextDigit = nextPending.pop() ?? null;
            setCurrentDigit(nextDigit);
            setPendingDigits(nextPending);
            
            const requiredPlayerPlacements = difficulty === "mudah" ? 9 : 15;
            
            if (correctDigitsCount + 1 === requiredPlayerPlacements) {
                handleEndGame("Selamat!", "Anda menyelesaikan ronde ini.", true);
            }
        } else {
            // ✨ 6. Panggil loseLife versi sederhana
            loseLife();
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
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
            // ✨ 7. Panggil loseLife versi sederhana di sini juga
            loseLife();
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
        }
    };

    // useEffect lainnya tetap sama
    useEffect(() => {
        if (gameActive) {
            setupNewRound();
        }
    }, [gameActive, setupNewRound]);
    
    useEffect(() => {
        if (isCountdown) {
            setHasilTerbilang("Bersiap...");
            setTargetDigits([]);
            setFilledSlots({});
            setPendingDigits([]);
            setCurrentDigit(null);
            setIsGameFinished(false);
        }
    }, [isCountdown]);

    // ✨ 8. HAPUS useEffect yang lama untuk timer
    // useEffect(() => {
    //     if (timer <= 0 && gameActive) {
    //         handleEndGame("Waktu Habis!", "Waktu Anda telah habis.", false);
    //     }
    // }, [timer, gameActive, handleEndGame]);

    // ... sisa kode JSX untuk render tidak berubah ...
    return (
     <div className="flex flex-col items-center">
         <NumberSlots
             digits={targetDigits}
             filledSlots={filledSlots}
             onSlotClick={handleSlotClick}
             fixedIndices={findFixedIndices(targetDigits)}
             countdownActive={isCountdown}
             displayLength={15}
             gameEnded={isGameFinished}
         />
         <div className="w-full mb-4">
             <div className="lg:max-w-3xl md:max-w-2xl sm:max-w-lg max-w-sm mx-auto flex flex-col gap-4">
                <div className={`p-4 rounded-xl shadow-md text-center font-semibold text-sm md:text-base min-h-[60px] flex items-center justify-center transition-colors border-2 ${flashError ? "bg-red-300" : "bg-[#faf8ff]"} ${isCountdown ? "text-gray-400" : ""}`}>
                     {isCountdown ? "Bersiap..." : hasilTerbilang}
                </div>
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
