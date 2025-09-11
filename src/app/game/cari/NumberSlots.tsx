import React from "react";
import NumberSlotsBase from "@/app/game/_components/NumberSlotsBase";

type Props = {
    digits: string[];
    selectedIndices: number[];
    wrongIndices: number[];
    isGameFinished: boolean;
    onSlotClick: (index: number) => void;
    countdownActive?: boolean;
    isCorrect?: boolean;
    isGameActive?: boolean;
};

export default function NumberSlots({
    digits,
    selectedIndices,
    wrongIndices,
    isGameFinished,
    onSlotClick,
    countdownActive = false,
    isCorrect = false,
    isGameActive = false,
}: Props) {

    return (
        <NumberSlotsBase isLoading={digits.length === 0 || countdownActive} placeholderLength={15}>
            {digits.map((digit, index) => {
                const isSelected = selectedIndices.includes(index);
                const isActuallyWrong = wrongIndices.includes(index);

                let slotClass = "";

                // Prioritas 1: Game sudah berakhir (waktu/nyawa habis)
                if (isGameFinished || !isGameActive) {
                    slotClass = "target-digit cursor-default"; // Dasar untuk semua slot

                    if (isSelected && isActuallyWrong) {
                        // TEPAT: Pemain memilih digit yang memang salah.
                        slotClass += " bg-green-500 text-white";
                    } else if (isSelected && !isActuallyWrong) {
                        // KELIRU: Pemain memilih digit yang seharusnya benar.
                        slotClass += " bg-red-500 text-white";
                    } else if (!isSelected && isActuallyWrong) {
                        // TERLEWAT: Pemain TIDAK memilih digit yang seharusnya salah.
                        slotClass += " border-2 border-green-500";
                    }
                }
                // Prioritas 2: Ronde baru saja dijawab dengan benar
                else if (isCorrect) {
                    slotClass = "target-digit cursor-default";
                    if (isSelected) {
                        slotClass += " bg-green-500 text-white";
                    }
                }
                // Prioritas 3: Game sedang berjalan, pemain sedang memilih
                else if (isSelected) {
                    slotClass = "target-digit cursor-pointer bg-blue-500 text-white";
                }
                // Prioritas 4: Kondisi default saat game berjalan
                else {
                    slotClass = "target-digit cursor-pointer hover:bg-gray-800";
                }

                return (
                    <React.Fragment key={`cell-group-${index}`}>
                        <span
                            onClick={() => !isGameFinished && !isCorrect && onSlotClick(index)}
                            className={`target-number-item transition-all duration-200 ${slotClass}`}
                        >
                            {digit}
                        </span>
                        {((index + 1) % 3 === 0 && index !== digits.length - 1) && (
                            <span className="target-number-item target-separator">.</span>
                        )}
                    </React.Fragment>
                );
            })}
        </NumberSlotsBase>
    );
}

