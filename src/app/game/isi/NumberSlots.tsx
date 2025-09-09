"use client";

import NumberSlotsBase from "@/app/game/_components/NumberSlotsBase";
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

    return (
        <NumberSlotsBase isLoading={digits.length === 0 || countdownActive} placeholderLength={15}>
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
                        <span className={`target-number-item ${slotClass}`}>
                            {isFixed ? digits[index] : (isFilled ? filledSlots[index] : isMissed ? digits[index] : "_")}
                        </span>
                        {((index + 1) % 3 === 0 && index < digits.length - 1) && <span className="target-number-item target-separator">.</span>}
                    </React.Fragment>
                );
            })}
        </NumberSlotsBase>
    );
}