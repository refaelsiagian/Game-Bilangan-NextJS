// TargetNumberDisplay.tsx
"use client";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
    subsets: ["latin"],
    weight: "500",
    variable: "--font-orbitron",
});

interface TargetNumberDisplayProps {
    targetNumber: string | null;
    formatWithDotsOrPlaceholder: (num: string | null, length?: number) => string[];
}

export default function TargetNumberDisplay({
    targetNumber,
    formatWithDotsOrPlaceholder,
}: TargetNumberDisplayProps) {
    const digits = formatWithDotsOrPlaceholder(targetNumber);

    return (
        <div className="text-center mb-4 relative z-10">
            <div className={`${orbitron.className} font-orbitron target-number-box`}>
                {digits.map((d, i) => (
                    <span
                        key={i}
                        className={`h-8 sm:h-10 md:h-12 lg:h-13 flex items-center justify-center rounded shadow-inner
              ${d === "." ? "target-separator" : "target-digit"}`}
                    >
                        {d}
                    </span>
                ))}
            </div>
        </div>
    );
}
