"use client";
import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { terbilang, generateRandomNumberByDifficulty, findFixedIndices } from "@/utils/number";
import NumberSlots from "./NumberSlots";
import { gameData } from "@/config/game.config";

export default function Isi() {
    // ✨ 1. Ambil 'lives' dan 'setOnTimeUpCallback' dari context
    const { lives, addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown, setOnTimeUpCallback } = useGame();
    const scoreDetail = gameData.cepat.find(m => m.path === 'isi')?.difficulty[difficulty].score;

    // State lokal tidak berubah
    const [targetNumber, setTargetNumber] = useState("");
    const [hasilTerbilang, setHasilTerbilang] = useState("");
    const [filledSlots, setFilledSlots] = useState<{ [index: number]: string }>({});
    const [fixedIndices, setFixedIndices] = useState<number[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [flashError, setFlashError] = useState(false);
    const [correctDigitsCount, setCorrectDigitsCount] = useState(0);

    // Fungsi-fungsi pembantu tidak berubah
    const highlightNextSlot = useCallback((currentTargetNumber: string, currentFilled: { [index: number]: string }, currentFixed: number[]) => {
        const remainingIndices = [];
        for (let i = 0; i < currentTargetNumber.length; i++) {
            if (currentFilled[i] === undefined && !currentFixed.includes(i)) {
                remainingIndices.push(i);
            }
        }

        if (remainingIndices.length > 0) {
            const randomIndex = remainingIndices[Math.floor(Math.random() * remainingIndices.length)];
            setHighlightedIndex(randomIndex);
        } else {
            setHighlightedIndex(null); // Tidak ada lagi yang bisa disorot
        }
    }, []);

    const setupNewRound = useCallback(() => {
        setIsGameFinished(false);
        setCorrectDigitsCount(0);

        const newTargetNumber = generateRandomNumberByDifficulty(difficulty);
        const newFixedIndices = difficulty === 'mudah' ? findFixedIndices(newTargetNumber.split('')) : [];
        const newFilledSlots: { [index: number]: string } = {};

        setHasilTerbilang(terbilang(Number(newTargetNumber)));
        setTargetNumber(newTargetNumber);
        setFixedIndices(newFixedIndices);
        setFilledSlots(newFilledSlots);

        highlightNextSlot(newTargetNumber, newFilledSlots, newFixedIndices);
    }, [difficulty, highlightNextSlot]);

    // ✨ 1. Ubah `handleEndGame` untuk menerima argumen `isWinCondition`
    const handleEndGame = useCallback((title: string, message: string, isWinCondition: boolean) => {
        if (isGameFinished) return;
        setIsGameFinished(true);

        const finalCorrectCount = !isWinCondition ? correctDigitsCount : difficulty == "mudah" ? 9 : 15;
        const pointsFromCorrect = finalCorrectCount * (scoreDetail?.correct ?? 0);
        const pointsCompleted = isWinCondition ? (scoreDetail?.completed ?? 0) : 0;
        const pointsTimeBonus = isWinCondition ? timer * (scoreDetail?.timeBonus ?? 0) : 0;
        const totalRoundScore = pointsFromCorrect + pointsCompleted + pointsTimeBonus;

        const overlayMessage = (
            <div className="text-left space-y-1">
                <p>{message}</p>
                <hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    {isWinCondition && <>
                        <span>Selesai</span>
                        <span className="text-right">{pointsCompleted}</span>
                    </>}
                    <span>Digit Benar</span>
                    <span className="text-right">{finalCorrectCount} x {scoreDetail?.correct} = {pointsFromCorrect}</span>
                    {isWinCondition && <>
                        <span>Bonus Waktu</span>
                        <span className="text-right">{timer} x {scoreDetail?.timeBonus} = {pointsTimeBonus}</span>
                    </>}
                    <span className="font-bold">Total Skor Ronde</span>
                    <span className="text-right font-bold">{totalRoundScore}</span>
                </div>
            </div>
        );

        endGame({title, message: overlayMessage});
    }, [endGame, correctDigitsCount, difficulty, isGameFinished, scoreDetail, timer]);

    // ✨ 2. Buat "surat instruksi" untuk Boss jika waktu habis
    const handleTimeUp = useCallback(() => {
        handleEndGame("Waktu Habis!", "Waktu Anda telah habis.", false);
    }, [handleEndGame]);

    // ✨ 3. Terapkan pola "Amplop": Daftarkan instruksi ke Boss
    useEffect(() => {
        // "Boss, ini surat instruksiku jika waktu habis."
        setOnTimeUpCallback(() => handleTimeUp);

        // "Boss, aku pergi. Ambil kembali suratku agar amplopmu bersih."
        return () => {
            setOnTimeUpCallback(null);
        };
    }, [setOnTimeUpCallback, handleTimeUp]);

    // ✨ 4. Terapkan pola Reaktif: Awasi nyawa
    useEffect(() => {
        // Jika nyawa habis dan permainan masih aktif...
        if (lives <= 0 && gameActive) {
            handleEndGame("Game Over", "Nyawa Anda habis.", false);
        }
    }, [lives, gameActive, handleEndGame]);


    const handleNumberClick = (num: number) => {
        if (highlightedIndex === null || isGameFinished || !gameActive) return;

        const correctDigit = targetNumber[highlightedIndex];

        if (String(num) === correctDigit) {
            // Jawaban BENAR
            const newFilledSlots = { ...filledSlots, [highlightedIndex]: correctDigit };
            setFilledSlots(newFilledSlots);
            // Hapus addScore dari sini agar tidak dipanggil berkali-kali
            addScore(scoreDetail?.correct ?? 0);
            setCorrectDigitsCount(prev => prev + 1);

            const isRoundWon = Object.keys(newFilledSlots).length + fixedIndices.length === targetNumber.length;
            if (isRoundWon) {
                handleEndGame("Selamat!", "Anda menyelesaikan ronde ini.", true);
            } else {
                highlightNextSlot(targetNumber, newFilledSlots, fixedIndices);
            }
        } else {
            // Jawaban SALAH
            // ✨ 5. Panggil loseLife versi sederhana
            loseLife();
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
            if (difficulty === 'sulit') {
                highlightNextSlot(targetNumber, filledSlots, fixedIndices);
            }
        }
    };

    // useEffect untuk setup ronde dan countdown tidak berubah
    useEffect(() => {
        if (gameActive) setupNewRound();
    }, [gameActive, setupNewRound]);

    useEffect(() => {
        if (isCountdown) {
            setTargetNumber("");
            setFilledSlots({});
            setHighlightedIndex(null);
            setHasilTerbilang("Bersiap...");
        }
    }, [isCountdown]);

    // ✨ 6. HAPUS useEffect yang lama untuk timer
    // useEffect(() => {
    //     if (timer <= 0 && gameActive) handleEndGame("Waktu Habis!", "Waktu Anda telah habis.");
    // }, [timer, gameActive, handleEndGame]);

    // ... sisa kode JSX untuk render ...
    const numberButtons = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0];
    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
            <NumberSlots
                digits={targetNumber.split('')}
                filledSlots={filledSlots}
                fixedIndices={fixedIndices}
                highlightedIndex={highlightedIndex}
                isGameFinished={isGameFinished}
                countdownActive={isCountdown}
            />
            <div className={`text-center mb-4 p-3 border rounded-lg shadow-sm w-full min-h-[60px] flex items-center justify-center transition ${flashError ? 'bg-red-300' : 'bg-white'}`}>
                <span className="text-gray-700 font-semibold text-lg">
                    {hasilTerbilang}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {numberButtons.map(num => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        disabled={!gameActive || isGameFinished}
                        className={`py-4 text-2xl font-bold rounded-lg shadow-md transition
                                 bg-white text-gray-800 border border-gray-300
                                 hover:bg-gray-100
                                 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
                                 ${num === 0 ? 'col-span-3' : ''}`}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
}
