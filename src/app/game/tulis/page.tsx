"use client";

import { terbilang, generateRandomNumberByDifficulty } from "@/utils/number";
import { useState, useCallback, useEffect } from "react";
import { useGame } from "@/app/game/_context/GameContext";
import { gameData } from "@/config/game.config";
import { JSX } from "react";

import NumberSlots from "@/app/game/tulis/NumberSlots";
import TerbilangBox from "@/app/game/_components/TerbilangBox";

const angkaDasar = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
const satuan = ["puluh", "belas", "ratus", "ribu", "juta", "miliar", "triliun"];
const khusus = ["sepuluh", "sebelas", "seratus", "seribu"];

export default function TulisGamePage() {

    // == CONTEXT ==
    const { lives, addScore, loseLife, endGame, gameActive, difficulty, timer, isCountdown, setOnTimeUpCallback } = useGame();

    // == STATE ==
    const [targetNumber, setTargetNumber] = useState<string>("");
    const [kataArray, setKataArray] = useState<string[]>([]);
    const [flashError, setFlashError] = useState(false);
    const [highlightedAnswer, setHighlightedAnswer] = useState<JSX.Element | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);

    // == HELPER ==
    const createHighlightedAnswer = useCallback((user: string, correct: string): { jsx: JSX.Element, count: number } => {
        const userWords = user.split(" ").filter(w => w);
        const correctWords = correct.split(" ");
        let correctCount = 0;
        for (let i = 0; i < Math.min(userWords.length, correctWords.length); i++) {
            if (userWords[i] !== correctWords[i]) break;
            correctCount++;
        }

        const jsx = (
            <span>
                {userWords.map((word, i) => (
                    <span key={i} className={i < correctCount ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {word}{" "}
                    </span>
                ))}
            </span>
        );
        return { jsx, count: correctCount };
    }, []);

    const prepareEndGameMessage = useCallback((msg: string, isWin: boolean, wordsCorrect: number): JSX.Element => {
        // Hitung skor
        const scoreConfig = gameData.cepat.find(m => m.path === 'tulis')?.difficulty[difficulty].score;
        const pointsCorrect = wordsCorrect * (scoreConfig?.correct || 0);
        const pointsCompleted = isWin ? (scoreConfig?.completed || 0) : 0;
        const pointsTimeBonus = isWin ? timer * (scoreConfig?.timeBonus || 0) : 0;
        const totalPoints = pointsCorrect + pointsCompleted + pointsTimeBonus;

        addScore(pointsCorrect);

        return (
            <div className="text-left space-y-1">
                <p>{msg}</p> <hr className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 text-sm sm:text-base">
                    {isWin && <>
                        <span>Selesai</span>
                        <span className="text-right">{pointsCompleted}</span>
                    </>}
                    <span>Kata Benar</span>
                    <span className="text-right">{wordsCorrect} x {scoreConfig?.correct} = {pointsCorrect}</span>
                    {isWin && <>
                        <span>Bonus Waktu</span>
                        <span className="text-right">{timer} x {scoreConfig?.timeBonus} = {pointsTimeBonus}</span>
                    </>}
                    <span className="font-bold">Total Skor</span>
                    <span className="text-right font-bold">{totalPoints}</span>
                </div>
            </div>
        );
    }, [addScore, difficulty, timer]);

    const setupNewRound = useCallback(() => {
        const num = generateRandomNumberByDifficulty(difficulty);
        setTargetNumber(num);
        setKataArray([]);
        setHighlightedAnswer(null);
        setIsGameFinished(false);
    }, [difficulty]);

    // == HANDLER ==
    const handleEndGame = useCallback((title: string, message: string, isWin: boolean) => {
        setIsGameFinished(true);
        const jawabanUser = kataArray.join(" ").trim();
        const jawabanBenar = terbilang(Number(targetNumber));

        const { jsx, count } = createHighlightedAnswer(jawabanUser, jawabanBenar);
        setHighlightedAnswer(jsx);

        const endMessage = prepareEndGameMessage(message, isWin, count);
        endGame({ title, message: endMessage });
    }, [targetNumber, kataArray, createHighlightedAnswer, prepareEndGameMessage, endGame]);

    const handleTimeUp = useCallback(() => {
        const jawabanBenar = terbilang(Number(targetNumber));
        handleEndGame(
            "Waktu Habis!",
            `Waktumu habis. Jawaban yang benar adalah: ${jawabanBenar}`,
            false
        );
    }, [handleEndGame, targetNumber]);

    const handleSubmit = () => {
        if (!gameActive || isGameFinished) return;
        const jawabanUser = kataArray.join(" ").trim();
        const jawabanBenar = terbilang(Number(targetNumber));

        if (jawabanUser === jawabanBenar) {
            handleEndGame("Selamat!", `Kamu berhasil!`, true);
        } else {
            setFlashError(true);
            setTimeout(() => setFlashError(false), 300);
            loseLife();
        }
    };

    // == EFFECT ==
    useEffect(() => {
        setOnTimeUpCallback(() => handleTimeUp);

        return () => {
            setOnTimeUpCallback(null);
        };
    }, [setOnTimeUpCallback, handleTimeUp]);

    useEffect(() => {
        if (gameActive) {
            setupNewRound();
        }
    }, [gameActive, setupNewRound]);

    useEffect(() => {
        if (isCountdown) {
            setKataArray([]);
            setHighlightedAnswer(null);
            setTargetNumber("");
            setIsGameFinished(false);
        }
    }, [isCountdown]);

    useEffect(() => {
        if (lives <= 0 && gameActive) {
            const jawabanBenar = terbilang(Number(targetNumber));
            handleEndGame("Game Over", `Nyawamu habis. Jawaban yang benar adalah: ${jawabanBenar}`, false);
        }
    }, [lives, gameActive, handleEndGame, targetNumber]);

    // == RENDER ==
    return (
        <div className="flex flex-col items-center">

            <NumberSlots targetNumber={targetNumber} isCountdown={isCountdown} />

            <TerbilangBox isCountdown={isCountdown} flashError={flashError} isMuted={isCountdown || kataArray.length === 0}>
                {highlightedAnswer
                    ? highlightedAnswer
                    : (kataArray.length === 0 ? "Gunakan tombol di bawah.." : kataArray.join(" "))
                }
            </TerbilangBox>

            {/* Tombol Kontrol */}
            <div className="text-center mb-6 z-10">
                <button
                    className="bg-amber-400 hover:bg-amber-500 px-4 py-2 rounded-xl mr-2 transition"
                    onClick={() => setKataArray(prev => prev.slice(0, -1))}
                    disabled={!gameActive}
                >
                    Hapus
                </button>
                <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
                    onClick={() => { setKataArray([]); }}
                    disabled={!gameActive}
                >
                    Reset
                </button>
                <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl ml-2 transition"
                    onClick={handleSubmit}
                    disabled={!gameActive}
                >
                    Submit
                </button>
            </div>

            {/* Papan Kata */}
            <div className="grid grid-cols-12 gap-4 mb-6 lg:max-w-[800px] md:max-w-[650px] sm:max-w-[500px] max-w-[350px] mx-auto z-10">
                <div className="col-span-12 md:col-span-5 bg-blue-50 rounded-lg p-4">
                    <h5 className="text-center mb-2 font-semibold">Angka Dasar</h5>
                    <div className="grid grid-cols-3 gap-2">
                        {angkaDasar.map((word, i) => (
                            <button
                                key={i}
                                className="px-2 py-2 rounded bg-purple-300 hover:bg-purple-400 w-full shadow-inner"
                                onClick={() => setKataArray((prev) => [...prev, word])}
                                disabled={!gameActive}
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
                                className="px-2 py-2 rounded bg-purple-300 hover:bg-purple-400 w-full shadow-inner"
                                onClick={() => setKataArray((prev) => [...prev, word])}
                                disabled={!gameActive}
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
                                className="px-2 py-2 rounded bg-purple-300 hover:bg-purple-400 w-full shadow-inner"
                                onClick={() => setKataArray((prev) => [...prev, word])}
                                disabled={!gameActive}
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}