import React from "react";

type Props = {
    digits: string[];
    selectedIndices: number[];
    wrongIndices: number[];
    isGameFinished: boolean;
    onSlotClick: (index: number) => void;
    countdownActive?: boolean;
    isCorrect?: boolean;
};

export default function NumberSlotsSalah({
    digits,
    selectedIndices,
    wrongIndices,
    isGameFinished,
    onSlotClick,
    countdownActive = false,
    isCorrect = false
}: Props) {

    if (digits.length === 0 || countdownActive) {
        const placeholders = Array.from({ length: 15 }, (_, i) => (
            <React.Fragment key={`ph-${i}`}>
                <span className="target-number-item target-digit">_</span>
                {((i + 1) % 3 === 0 && i !== 14) && <span className="target-number-item target-separator">.</span>}
            </React.Fragment>
        ));
        return <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">{placeholders}</div>
        </div>;
    }

    return (
        <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">
                {digits.map((digit, index) => {
                    const isSelected = selectedIndices.includes(index);
                    const isActuallyWrong = wrongIndices.includes(index);
                    
                    let slotClass = "";

                    // Prioritas 1: Game sudah berakhir (waktu/nyawa habis)
                    if (isGameFinished) {
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
                        <React.Fragment key={`digit-frag-${index}`}>
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
            </div>
        </div>
    );
}

