import React from "react";
import NumberSlotsBase from "@/app/game/_components/NumberSlotsBase";

type Props = {
    digits: string[];
    activeIndices?: number[]; 
    fixedIndices?: number[];  
    revealDigits?: boolean;
    countdownActive?: boolean;
};

export default function NumberSlots({
    digits,
    activeIndices = [],
    fixedIndices = [],
    revealDigits = false,
    countdownActive = false,
}: Props) {

    return (
        <NumberSlotsBase isLoading={digits.length === 0 || countdownActive} placeholderLength={15}>
            {digits.map((digit, index) => {
                const isBlinking = activeIndices.includes(index);
                const isFixed = fixedIndices.includes(index);
                const shouldBeVisible = isBlinking || isFixed || revealDigits;

                return (
                    <React.Fragment key={`cell-group-${index}`}>
                        <span
                            className={`target-number-item 
                                    transition-colors duration-200 target-digit`}
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