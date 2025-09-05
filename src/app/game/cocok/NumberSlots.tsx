// components/NumberSlots.tsx
import React, { useMemo } from "react";
import { findFixedIndices } from "@/utils/number";

type Props = {
    digits: string[];
    difficulty: "mudah" | "sedang" | "sulit";
    countdownActive?: boolean;
    displayLength?: number;
    // --- TAMBAHAN PROPS BARU ---
    hintIndices?: number[];
    revealDigits?: boolean;
};

export default function NumberSlots({
    digits,
    difficulty,
    countdownActive = false,
    displayLength = 15,
    // --- PROPS BARU DENGAN DEFAULT KOSONG ---
    hintIndices = [],
    revealDigits = false,
}: Props) {
    // Memo untuk digit yang sudah terpasang di mode mudah
    const fixedIndices = useMemo(
        () => (difficulty === "mudah" ? findFixedIndices(digits) : []),
        [difficulty, digits]
    );

    // components/NumberSlots.tsx (Pastikan kodenya seperti ini)
    const renderCells = useMemo(() => {
        // Jika num belum ada ATAU countdown aktif, tampilkan placeholder
        const place = digits.length === 0 || countdownActive;
        console.log({place});
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

        // Jika tidak, render digit angka yang sebenarnya.
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
                    // --- LOGIKA UTAMA YANG DIPERBARUI ---
                    const isFixed = fixedIndices.includes(idx); // Untuk mode 'pilih' mudah
                    const isHint = hintIndices.includes(idx);   // Untuk mode 'cocok'
                    const isMissed = revealDigits && !isFixed && !isHint;

                    const shouldBeVisible = isFixed || isHint;

                    return (
                        <span
                            key={`d-${idx}`}
                            className={`h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl 
                                ${isMissed ? "target-digit-missed cursor-default" : "target-digit cursor-default"}`
                            }
                        >
                            {/* Tampilkan digit jika itu hint, fixed, atau sudah diisi */}
                            {shouldBeVisible ? digits[idx] :
                                isMissed ? digits[idx] : "_"}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}