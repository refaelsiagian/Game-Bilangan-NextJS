// components/NumberSlots.tsx
import React, { useMemo } from "react";
import { findFixedIndices } from "@/utils/number";

type Props = {
    digits: string[];
    filledSlots: { [index: number]: string };
    onSlotClick: (index: number) => void;
    difficulty: "mudah" | "sedang" | "sulit";
    countdownActive?: boolean;
    displayLength?: number;
    gameEnded?: boolean; // 👈 tambahan
};

export default function NumberSlots({
    digits,
    filledSlots,
    onSlotClick,
    difficulty,
    countdownActive = false,
    displayLength = 15,
    gameEnded = false, // default false
}: Props) {
    const fixedIndices = useMemo(
        () => (difficulty === "mudah" ? findFixedIndices(digits) : []),
        [difficulty, digits]
    );

    const renderCells = useMemo(() => {
        //　Jika num belum ada, tampilkan placeholder
        if (digits.length === 0 || countdownActive) {
            const placeholder: Array<{ type: "digit" | "sep"; value: string; digitIndex?: number }> = [];
            for (let i = 0; i < displayLength; i++) {
                placeholder.push({ type: "digit", value: "_", digitIndex: i });
                if ((i + 1) % 3 === 0 && i !== displayLength - 1) {
                    placeholder.push({ type: "sep", value: "." });
                }
            }
            return placeholder;
        }

        const cells: Array<{ type: "digit" | "sep"; value: string; digitIndex?: number }> = [];
        for (let i = 0; i < digits.length; i++) {
            cells.push({ type: "digit", value: digits[i], digitIndex: i });
            if ((i + 1) % 3 === 0 && i !== digits.length - 1) {
                cells.push({ type: "sep", value: "." });
            }
        }
        return cells;
    }, [digits, countdownActive, displayLength]);

    return (
        <div className="text-center mb-4 relative z-10">
            <div className={`font-orbitron target-number-box`}>
                {renderCells.map((cell, viewIndex) => {
                    if (cell.type === "sep") {
                        return (
                            <span key={`sep-${viewIndex}`} className="h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl target-separator">
                                {cell.value}
                            </span>
                        );
                    }

                    const idx = cell.digitIndex!;
                    const isFixed = fixedIndices.includes(idx);
                    const isFilled = filledSlots[idx] !== undefined;
                    const isMissed = gameEnded && !isFixed && !isFilled; // 👈 tambahan

                    return (
                        <span
                            key={`d-${idx}`}
                            data-index={idx}
                            onClick={() => {
                                if (isFixed || isFilled || gameEnded) return;
                                onSlotClick(idx);
                            }}
                            className={`h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl
                                ${isFixed ? "target-digit cursor-default" 
                                    : isFilled ? "target-digit-filled cursor-default" 
                                    : isMissed ? "target-digit-missed cursor-default" 
                                    : "target-digit hover:bg-gray-800 cursor-pointer"}
                            `}
                            aria-label={`slot-${idx}`}
                        >
                            {isFixed ? digits[idx] : (isFilled ? filledSlots[idx] : isMissed ? digits[idx] : "_")}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
