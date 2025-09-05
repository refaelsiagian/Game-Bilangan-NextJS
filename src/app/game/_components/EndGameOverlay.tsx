"use client";
import { ReactNode } from "react";

type EndGameOverlayProps = {
    title: string;
    message: ReactNode;
    isVisible: boolean;
    onPlayAgain: () => void;
    onBackToMenu: () => void;
    onViewBoard: () => void;
    onShowCard: () => void;
};

export default function EndGameOverlay({ title, message, isVisible, onPlayAgain, onBackToMenu, onViewBoard, onShowCard }: EndGameOverlayProps) {
    return (
        <div
            className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-40 transition-opacity duration-500 cursor-pointer"
            onClick={onShowCard}
            onKeyDown={onShowCard}
            tabIndex={0}
            role="button"
            aria-label="Tampilkan kembali hasil permainan"
        >
            {isVisible && (
                <div
                    className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full animate-endgame-popup cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-3xl font-bold mb-4">{title}</h2>
                    <div className="mb-6">{message}</div>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <button onClick={onBackToMenu} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl">Menu</button>
                        <button onClick={onViewBoard} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-xl">Lihat</button>
                        <button onClick={onPlayAgain} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl">Main Lagi</button>
                    </div>
                </div>
            )}
            {!isVisible && (
                <p className="mt-4 text-white text-lg animate-pulse">
                    Tekan apapun untuk kembali...
                </p>
            )}
        </div>
    );
}