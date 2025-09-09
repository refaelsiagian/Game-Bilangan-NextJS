"use client";

import NumberSlotsBase from "@/app/game/_components/NumberSlotsBase";
import React from "react"; // Impor React untuk Fragment

type Props = {
    targetNumber: string;
    isCountdown: boolean;
};

export default function NumberSlots({ targetNumber, isCountdown }: Props) {

    const digits = targetNumber.split('');

    return (
        <NumberSlotsBase isLoading={isCountdown} placeholderLength={15}>
            {digits.map((digit, index) => (
                // Gunakan React.Fragment agar key bisa diterapkan pada grup elemen
                <React.Fragment key={`cell-group-${index}`}>
                    <span className="target-number-item target-digit">
                        {digit}
                    </span>

                    {/* Render separator secara kondisional di dalam loop */}
                    {((index + 1) % 3 === 0 && index < digits.length - 1) && (
                        <span className="target-number-item target-separator">.</span>
                    )}
                </React.Fragment>
            ))}
        </NumberSlotsBase>
    );
}