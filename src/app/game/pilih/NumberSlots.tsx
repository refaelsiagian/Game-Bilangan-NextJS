import NumberSlotsBase from "@/app/game/_components/NumberSlotsBase";
import React from "react";

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
        <NumberSlotsBase isLoading={digits.length === 0 || countdownActive} placeholderLength={displayLength}>
            {digits.map((digit, index) => {
                
                const isFixed = fixedIndices.includes(index);
                const isFilled = filledSlots[index] !== undefined;
                const isMissed = gameEnded && !isFixed && !isFilled;

                const slotClass = isFixed // Digit yang tetap
                    ? "target-digit cursor-default"
                    : isFilled // Digit yang sudah diisi
                        ? "target-digit-filled cursor-default"
                        : isMissed // Digit yang terlewat
                            ? "target-digit-missed cursor-default"
                            : "target-digit hover:bg-gray-800 cursor-pointer"; // Default

                const content = isFixed
                    ? digits[index]
                    : isFilled
                        ? filledSlots[index]
                        : isMissed
                            ? digits[index]
                            : "_";

                return (
                    <React.Fragment key={`cell-group-${index}`}>
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
        </NumberSlotsBase>
    );
}