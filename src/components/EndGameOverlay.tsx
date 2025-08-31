// components/EndGameOverlay.tsx
"use client";
import React from "react";
import { JSX } from "react";

interface EndGameOverlayProps {
    visible: boolean; // apakah overlay muncul
    title: string;
    message: JSX.Element | string;
    onBack: () => void;        // tombol Kembali
    onView: () => void;        // tombol Lihat
    onRestart: () => void;     // tombol Main Lagi
    cardVisible: boolean; // apakah card muncul
}

export default function EndGameOverlay({
    visible,
    title,
    message,
    onBack,
    onView,
    onRestart,
    cardVisible,       // tambahan prop untuk kontrol card
}: EndGameOverlayProps ) {

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-40 transition-opacity duration-500"
            tabIndex={0}
        >
            {/* CARD */}
            {cardVisible && (
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full transform scale-90 opacity-0 animate-endgame-popup">
                    <h2 className="text-4xl font-bold mb-4">{title}</h2>
                    <div className="mb-6">{message}</div>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
                            onClick={onBack}
                        >
                            Kembali
                        </button>
                        <button
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-xl"
                            onClick={onView}
                        >
                            Lihat
                        </button>
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
                            onClick={onRestart}
                        >
                            Main Lagi
                        </button>
                    </div>
                </div>
            )}

            {/* TEKAN APA PUN */}
            {!cardVisible && (
                <p className="mt-4 text-white text-lg animate-blink">
                    Tekan apapun untuk kembali...
                </p>
            )}
        </div>
    );
}

