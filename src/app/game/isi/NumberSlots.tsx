// app/game/_components/NumberSlotsIsi.tsx

import React from "react";

type Props = {
    digits: string[];
    filledSlots: { [index: number]: string };
    fixedIndices: number[];
    highlightedIndex: number | null;
    isGameFinished: boolean;
    countdownActive?: boolean;
};

export default function NumberSlots({
    digits,
    filledSlots,
    fixedIndices,
    highlightedIndex,
    isGameFinished,
    countdownActive = false,
}: Props) {
    const displayLength = 15;

    if (digits.length === 0 || countdownActive) {
        const placeholders = Array.from({ length: displayLength });
        return (
            <div className="text-center mb-4 relative z-10">
                <div className="font-orbitron target-number-box">
                    {placeholders.map((_, index) => (
                        <React.Fragment key={`ph-group-${index}`}>
                            <span className="h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl target-digit">_</span>
                            {((index + 1) % 3 === 0 && index < displayLength - 1) && <span className="target-separator">.</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">
                {digits.map((digit, index) => {
                    const isFixed = fixedIndices.includes(index);
                    const isFilled = filledSlots[index] !== undefined;
                    const isHighlighted = index === highlightedIndex;
                    const isMissed = isGameFinished && !isFixed && !isFilled;

                    let slotClass = "target-digit"; // Default empty
                    if (isFixed) {
                        slotClass = "target-digit"; // Bantuan mode mudah
                    } else if (isFilled) {
                        slotClass = "target-digit-filled"; // Sudah diisi pemain
                    } else if (isMissed) {
                        slotClass = "target-digit-missed"; // Terlewat di akhir
                    }

                    if (isHighlighted) {
                        slotClass = isMissed ? "target-digit-missed border-2 border-yellow-400" : 
                            isFilled ? "target-digit-filled border-2 border-yellow-400" : "target-digit border-2 border-yellow-400"; // Disorot
                    }

                    return (
                        <React.Fragment key={`cell-group-${index}`}>
                            <span className={`h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl ${slotClass}`}>
                                {isFixed ? digits[index] : (isFilled ? filledSlots[index] : isMissed ? digits[index] : "_")}
                            </span>
                            {((index + 1) % 3 === 0 && index < digits.length - 1) && <span className="target-separator">.</span>}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}