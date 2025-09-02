// components/NumberSlots.tsx
import React, { useMemo } from "react";
import { findFixedIndices } from "@/utils/number"; // findFixedIndices tidak perlu lagi di sini jika sudah diurus di parent

type Props = {
    digits: string[];
    orbitronClass?: string;
    countdownActive?: boolean;
    difficulty?: "mudah" | "sedang" | "sulit"; // Tidak perlu jika tidak digunakan di sini
    // --- UBAH PROPS INI AGAR LEBIH UMUM ---
    activeIndices?: number[]; // Indeks digit yang harus terlihat (baik fixed maupun blink)
    revealDigits?: boolean; // Untuk mengungkap semua digit di akhir
};

export default function NumberSlots({
    digits,
    orbitronClass,
    difficulty, // Tidak perlu jika tidak digunakan di sini
    countdownActive = false,
    activeIndices = [],
    revealDigits = false,
}: Props) {


    const fixedIndices = useMemo(
        () => (difficulty === "mudah" ? findFixedIndices(digits) : []),
        [difficulty, digits]
    );

    const renderCells = useMemo(() => {
        const placeholderLength = 15; // Sesuaikan dengan panjang maksimal angka
        const cells: Array<{ type: "digit" | "sep"; value: string; digitIndex?: number }> = [];

        const effectiveDigits = (digits.length === 0 || countdownActive) ? Array(placeholderLength).fill("_") : digits;

        for (let i = 0; i < effectiveDigits.length; i++) {
            cells.push({ type: "digit", value: effectiveDigits[i], digitIndex: i });
            if ((i + 1) % 3 === 0 && i !== effectiveDigits.length - 1) {
                cells.push({ type: "sep", value: "." });
            }
        }
        return cells;
    }, [digits, countdownActive]);

    return (
        <div className="text-center mb-4 relative z-10">
            <div className={`${orbitronClass ?? ""} font-orbitron target-number-box`}>
                {renderCells.map((cell, viewIndex) => {
                    if (cell.type === "sep") {
                        return (
                            <span key={`sep-${viewIndex}`} className="h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl target-separator">
                                {cell.value}
                            </span>
                        );
                    }

                    const idx = cell.digitIndex!;
                    const isActive = activeIndices.includes(idx);
                    const isFixed = fixedIndices.includes(idx);
                    // Digit harus terlihat jika aktif (blink) atau tetap (fixed)
                    const shouldBeVisible = isActive || isFixed || revealDigits;

                    return (
                        <span
                            key={`d-${idx}`}
                            className={`h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl 
                            target-digit transition-colors duration-300`}
                        >
                            {/* Tampilkan digit jika aktif atau saat diungkap */}
                            {shouldBeVisible ? digits[idx] : "_"}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}