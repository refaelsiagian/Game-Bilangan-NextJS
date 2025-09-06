"use client";
import React from "react"; // Impor React untuk Fragment

type Props = {
    targetNumber: string;
    isCountdown: boolean;
};

export default function NumberSlots({ targetNumber, isCountdown }: Props) {
    const displayLength = 15;

    // Tentukan sel yang akan dirender: placeholder atau digit asli
    const cellsToRender = (!targetNumber || isCountdown)
        ? Array(displayLength).fill("_")
        : targetNumber.split('');

    return (
        <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">
                {cellsToRender.map((cellContent, index) => (
                    // Gunakan React.Fragment agar key bisa diterapkan pada grup elemen
                    <React.Fragment key={`cell-group-${index}`}>
                        <span className="h-8 sm:h-10 md:h-12 lg:h-14 flex items-center justify-center rounded shadow-xl target-digit">
                            {cellContent}
                        </span>

                        {/* Render separator secara kondisional di dalam loop */}
                        {((index + 1) % 3 === 0 && index < cellsToRender.length - 1) && (
                            <span className="target-separator">.</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}