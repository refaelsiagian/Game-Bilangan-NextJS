"use client";

import React from "react";
import NumberSlotsBase from "@/app/game/_components/NumberSlotsBase";

type Props = {
    digits: string[];
    activeIndices?: number[]; // Indeks digit yang harus terlihat (blink)
    fixedIndices?: number[];  // Indeks digit yang terlihat permanen (mode mudah)
    revealDigits?: boolean;   // Untuk mengungkap semua digit di akhir
    countdownActive?: boolean;
};

export default function NumberSlots({
    digits,
    activeIndices = [],
    fixedIndices = [],
    revealDigits = false,
    countdownActive = false,
}: Props) {

    // Render utama saat game berjalan
    return (
        <NumberSlotsBase isLoading={digits.length === 0 || countdownActive} placeholderLength={15}>
            {digits.map((digit, index) => {
                // Logika unik dari mode "Kedip" tetap dipertahankan di sini
                const isBlinking = activeIndices.includes(index);
                const isFixed = fixedIndices.includes(index);
                const shouldBeVisible = isBlinking || isFixed || revealDigits;

                // Berikan style khusus untuk digit yang berkedip
                const digitClass = isBlinking
                    ? "target-digit" // Class untuk membuatnya bersinar/berkedip
                    : "target-digit";

                return (
                    <React.Fragment key={`cell-group-${index}`}>
                        <span
                            className={`target-number-item 
                                    transition-colors duration-200 ${digitClass}`}
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