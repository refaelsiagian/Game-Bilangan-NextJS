// app/game/_components/NumberSlotsPilih.tsx

import React from "react";

// Props tidak berubah
type Props = {
    digits: string[];
    filledSlots: { [index: number]: string };
    onSlotClick: (index: number) => void;
    fixedIndices: number[];
    countdownActive?: boolean;
    displayLength?: number;
    gameEnded?: boolean;
};

export default function NumberSlots({
    digits,
    filledSlots,
    onSlotClick,
    fixedIndices,
    countdownActive = false,
    displayLength = 15,
    gameEnded = false,
}: Props) {

    return (
        <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">
                {/* Logika render sekarang ada di sini */}
                {(digits.length === 0 || countdownActive)
                    // Jika countdown atau data belum siap, render placeholder
                    ? Array.from({ length: displayLength }).map((_, index) => (
                        <React.Fragment key={`ph-${index}`}>
                            <span className="target-number-item target-digit">_</span>
                            {((index + 1) % 3 === 0 && index < displayLength - 1) && (
                                <span className="target-number-item target-separator">.</span>
                            )}
                        </React.Fragment>
                    ))
                    // Jika game berjalan, render digit asli
                    : digits.map((digit, index) => {
                        // Semua logika unik dari mode "Pilih" tetap dipertahankan di sini
                        const isFixed = fixedIndices.includes(index);
                        const isFilled = filledSlots[index] !== undefined;
                        const isMissed = gameEnded && !isFixed && !isFilled;

                        const slotClass = isFixed
                            ? "target-digit cursor-default"
                            : isFilled
                                ? "target-digit-filled cursor-default"
                                : isMissed
                                    ? "target-digit-missed cursor-default"
                                    : "target-digit hover:bg-gray-800 cursor-pointer";

                        const content = isFixed
                            ? digits[index]
                            : isFilled
                                ? filledSlots[index]
                                : isMissed
                                    ? digits[index]
                                    : "_";

                        return (
                            <React.Fragment key={`cell-${index}`}>
                                <span
                                    onClick={() => {
                                        if (isFixed || isFilled || gameEnded) return;
                                        onSlotClick(index);
                                    }}
                                    className={`target-number-item ${slotClass}`}
                                    aria-label={`slot-${index}`}
                                >
                                    {content}
                                </span>
                                {((index + 1) % 3 === 0 && index < digits.length - 1) && (
                                    <span className="target-number-item target-separator">.</span>
                                )}
                            </React.Fragment>
                        );
                    })}
            </div>
        </div>
    );
}