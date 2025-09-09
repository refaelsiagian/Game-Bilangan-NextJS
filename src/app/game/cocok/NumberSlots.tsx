"use client";

import NumberSlotsBase from "@/app/game/_components/NumberSlotsBase";
import React from "react";

type Props = {
    digits: string[];
    hintIndices?: number[];   
    revealDigits?: boolean;   
    countdownActive?: boolean;
};

export default function NumberSlotsCocok({
    digits,
    hintIndices = [],
    revealDigits = false,
    countdownActive = false,
}: Props) {

    return (
        <NumberSlotsBase isLoading={digits.length === 0 || countdownActive} placeholderLength={15}>
            {digits.map((digit, index) => {
                
                const isHint = hintIndices.includes(index);
                const shouldBeVisible = isHint || revealDigits;

                let digitClass = "target-digit";
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
                            className={`target-number-item 
                                    transition-colors duration-300 ${digitClass}`}
                        >
                            {shouldBeVisible ? digit : "_"}
                        </span>

                        {((index + 1) % 3 === 0 && index < digits.length - 1) && (
                            <span className="target-number-item target-separator">.</span>
                        )}
                    </React.Fragment>
                );
            })}
        </NumberSlotsBase>
    );
}