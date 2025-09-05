"use client";
import { useMemo } from "react";

type Props = {
    targetNumber: string;
    isCountdown: boolean;
};

export default function NumberSlots({ targetNumber, isCountdown }: Props) {
    const renderCells = useMemo(() => {
        const displayLength = 15; // Selalu tampilkan 15 slot
        if (!targetNumber || isCountdown) {
            return Array(displayLength).fill("_");
        }
        return targetNumber.split('');
    }, [targetNumber, isCountdown]); // BENAR: Tambahkan dependensi

    const cellsWithSeparators = [];
    for (let i = 0; i < renderCells.length; i++) {
        cellsWithSeparators.push(
            <span key={`d-${i}`} className="target-digit">{renderCells[i]}</span>
        );
        if ((i + 1) % 3 === 0 && i < renderCells.length - 1) {
            cellsWithSeparators.push(
                <span key={`s-${i}`} className="target-separator">.</span>
            );
        }
    }

    return (
        <div className="text-center mb-4">
            <div className="target-number-box font-orbitron">
                {cellsWithSeparators}
            </div>
        </div>
    );
}