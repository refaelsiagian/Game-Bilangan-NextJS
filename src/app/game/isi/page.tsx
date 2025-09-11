"use client";

import { terbilang, generateRandomNumberByDifficulty, findFixedIndices } from "@/utils/number";
import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { gameData } from "@/config/game.config";
import NumberSlots from "@/app/game/isi/NumberSlots";
import TerbilangBox from "@/app/game/_components/TerbilangBox";

export default function Isi() {
    // == CONTEXT ==
    const { lives, addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown, setOnTimeUpCallback } = useGame();
    const scoreDetail = gameData.cepat.find(m => m.path === 'isi')?.difficulty[difficulty].score;

    // == STATE ==
    const [targetNumber, setTargetNumber] = useState("");
    const [hasilTerbilang, setHasilTerbilang] = useState("");
    const [filledSlots, setFilledSlots] = useState<{ [index: number]: string }>({});
    const [fixedIndices, setFixedIndices] = useState<number[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [flashError, setFlashError] = useState(false);
    const [correctDigitsCount, setCorrectDigitsCount] = useState(0);

    // == HELPERS ===
    const highlightNextSlot = useCallback((currentTargetNumber: string, currentFilled: { [index: number]: string }, currentFixed: number[]) => {
        const remainingIndices = [];
        for (let i = 0; i < currentTargetNumber.length; i++) {
            if (currentFilled[i] === undefined && !currentFixed.includes(i)) {
                remainingIndices.push(i);
            }
        }

        // Pilih salah satu slot yang belum diisi secara acak untuk disorot
        if (remainingIndices.length > 0) {
            const randomIndex = remainingIndices[Math.floor(Math.random() * remainingIndices.length)];
            setHighlightedIndex(randomIndex);
        } else {
            setHighlightedIndex(null);
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

    // == HANDLERS ==
    const handleNumberClick = (num: number) => {
        if (highlightedIndex === null || isGameFinished || !gameActive) return;

        const correctDigit = targetNumber[highlightedIndex];

        // Cek apakah digit yang dipilih benar
        if (String(num) === correctDigit) {
            const newFilledSlots = { ...filledSlots, [highlightedIndex]: correctDigit };
            setFilledSlots(newFilledSlots);
            addScore(scoreDetail?.correct ?? 0);
            setCorrectDigitsCount(prev => prev + 1);

            const isRoundWon = Object.keys(newFilledSlots).length + fixedIndices.length === targetNumber.length;
            if (isRoundWon) {
                handleEndGame("Selamat!", "Anda menyelesaikan ronde ini.", true);
            } else {
                highlightNextSlot(targetNumber, newFilledSlots, fixedIndices);
            }
        } else {
            loseLife();
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
            if (difficulty === 'sulit') {
                highlightNextSlot(targetNumber, filledSlots, fixedIndices);
            }
        }
    };

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

        endGame({ title, message: overlayMessage });
    }, [endGame, correctDigitsCount, difficulty, isGameFinished, scoreDetail, timer]);

    const handleTimeUp = useCallback(() => {
        handleEndGame("Waktu Habis!", "Waktu Anda telah habis.", false);
    }, [handleEndGame]);

    // == EFFECTS ==
    useEffect(() => {
        setOnTimeUpCallback(() => handleTimeUp);

        return () => {
            setOnTimeUpCallback(null);
        };
    }, [setOnTimeUpCallback, handleTimeUp]);

    useEffect(() => {
        if (lives <= 0 && gameActive) {
            handleEndGame("Game Over", "Nyawa Anda habis.", false);
        }
    }, [lives, gameActive, handleEndGame]);

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

    // == RENDER ==
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

            <TerbilangBox isCountdown={isCountdown} flashError={flashError} isMuted={isCountdown || hasilTerbilang === ""}>
                {hasilTerbilang}
            </TerbilangBox>

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
