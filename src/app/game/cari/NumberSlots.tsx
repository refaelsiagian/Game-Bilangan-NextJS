// app/game/_components/NumberSlotsSalah.tsx

import React from "react";

type Props = {
    digits: string[];
    selectedIndices: number[];
    wrongIndices: number[];
    isGameFinished: boolean;
    onSlotClick: (index: number) => void;
    countdownActive?: boolean;
    isCorrect?: boolean;
};

export default function NumberSlotsSalah({
    digits,
    selectedIndices,
    wrongIndices,
    isGameFinished,
    onSlotClick,
    countdownActive = false,
    isCorrect = false
}: Props) {

    // Jika belum ada angka (saat countdown), tampilkan placeholder
    if (digits.length === 0 || countdownActive) {
        const placeholders = Array.from({ length: 15 }, (_, i) => (
            <React.Fragment key={`ph-${i}`}>
                <span className="target-number-item target-digit">_</span>
                {((i + 1) % 3 === 0 && i !== 14) && <span className="target-number-item target-separator">.</span>}
            </React.Fragment>
        ));
        return <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">{placeholders}</div>
        </div>;
    }

    return (
        <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">
                {digits.map((digit, index) => {
                    const isSelected = selectedIndices.includes(index);
                    const isActuallyWrong = wrongIndices.includes(index);

                    let slotClass = "target-digit cursor-pointer hover:bg-gray-800"; // Default

                    if (isGameFinished) {
                        slotClass = "target-digit cursor-default"; // Dasar saat game selesai
                        if (isActuallyWrong && isSelected) {
                            // Benar: Memilih digit yang memang salah
                            slotClass += " bg-green-500 text-white";
                        } else if (!isActuallyWrong && isSelected) {
                            // Salah: Memilih digit yang seharusnya benar
                            slotClass += " bg-red-500 text-white";
                        } else if (isActuallyWrong && !isSelected) {
                            // Terlewat: Tidak memilih digit yang seharusnya salah
                            slotClass += " border-2 border-green-500";
                        }
                    } else if (isSelected) {
                        // Saat game berjalan dan digit dipilih
                        slotClass = "target-digit cursor-pointer text-white";
                        if (isCorrect) {
                            // Benar: Memilih digit yang seharusnya benar
                            slotClass += " bg-green-500";
                        } else {
                            // Salah: Memilih digit yang seharusnya salah
                            slotClass += " bg-blue-500";
                        }
                    }

                    return (
                        <React.Fragment key={`digit-frag-${index}`}>
                            <span
                                onClick={() => !isGameFinished && onSlotClick(index)}
                                className={`target-number-item transition-colors duration-200 ${slotClass}`}
                            >
                                {digit}
                            </span>
                            {((index + 1) % 3 === 0 && index !== digits.length - 1) && (
                                <span className="target-number-item target-separator">.</span>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}