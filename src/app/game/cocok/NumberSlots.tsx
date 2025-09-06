// app/game/_components/NumberSlotsCocok.tsx

import React from "react";

type Props = {
    digits: string[];
    hintIndices?: number[];   // Indeks digit yang menjadi petunjuk
    revealDigits?: boolean;   // Untuk mengungkap semua digit setelah menjawab
    countdownActive?: boolean;
};

export default function NumberSlotsCocok({
    digits,
    hintIndices = [],
    revealDigits = false,
    countdownActive = false,
}: Props) {
    const displayLength = 15;

    // Handle kondisi placeholder untuk kebersihan kode
    if (digits.length === 0 || countdownActive) {
        const placeholders = Array.from({ length: displayLength });
        return (
            <div className="text-center mb-4 relative z-10">
                <div className="font-orbitron target-number-box">
                    {placeholders.map((_, index) => (
                        <React.Fragment key={`ph-group-${index}`}>
                            <span className="h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl target-digit">_</span>
                            {((index + 1) % 3 === 0 && index < displayLength - 1) && (
                                <span className="target-separator">.</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    // Render utama saat game berjalan
    return (
        <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">
                {digits.map((digit, index) => {
                    // Logika unik dari mode "Cocok" dipertahankan di sini
                    const isHint = hintIndices.includes(index);
                    const shouldBeVisible = isHint || revealDigits;
                    
                    // Berikan style khusus untuk digit hint dan yang terungkap
                    let digitClass = "target-digit"; // Default, digit tersembunyi
                    if (revealDigits && !isHint) {
                        // Digit yang baru terungkap setelah menjawab
                        digitClass = "target-digit-missed"; 
                    } else if (isHint) {
                        // Digit petunjuk yang terlihat dari awal
                        digitClass = "target-digit";
                    }

                    return (
                        <React.Fragment key={`cell-group-${index}`}>
                            <span
                                className={`h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl 
                                    transition-colors duration-300 ${digitClass}`}
                            >
                                {shouldBeVisible ? digit : "_"}
                            </span>

                            {((index + 1) % 3 === 0 && index < digits.length - 1) && (
                                <span className="target-separator">.</span>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}