"use client";

import React from "react";

type Props = {
    /** Konten game yang sebenarnya untuk ditampilkan */
    children: React.ReactNode; 
    /** Flag untuk menampilkan placeholder */
    isLoading: boolean;
    /** Panjang placeholder yang diinginkan */
    placeholderLength?: number;
};

export default function NumberSlotsBase({
    children,
    isLoading,
    placeholderLength = 15
}: Props) {

    // Jika isLoading (misalnya, saat countdown atau data belum ada),
    // tampilkan placeholder. Ini adalah logika yang kita satukan.
    if (isLoading) {
        const placeholders = Array.from({ length: placeholderLength });
        return (
            <div className="text-center mb-4 relative z-10">
                <div className="font-orbitron target-number-box">
                    {placeholders.map((_, index) => (
                        <React.Fragment key={`ph-group-${index}`}>
                            <span className="target-number-item target-digit">_</span>
                            {((index + 1) % 3 === 0 && index < placeholderLength - 1) && (
                                <span className="target-number-item target-separator">.</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    // Jika tidak loading, tampilkan konten game yang sebenarnya (children)
    // yang akan di-render oleh komponen mode spesifik.
    return (
        <div className="text-center mb-4 relative z-10">
            <div className="font-orbitron target-number-box">
                {children}
            </div>
        </div>
    );
}