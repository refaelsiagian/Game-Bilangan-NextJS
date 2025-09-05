"use client";

export default function CountdownOverlay({ count }: { count: number }) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="text-9xl text-white font-bold animate-pulse">{count}</div>
        </div>
    );
}