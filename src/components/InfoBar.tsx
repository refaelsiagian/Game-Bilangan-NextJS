const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

const renderLives = (lives: number) => {
    const total = 3;
    return Array.from({ length: total }, (_, i) =>
        i < lives ? "❤️" : "🖤"
    ).join("");
};

interface InfoBarProps {
    score: number;
    timer: number;
    lives: number;
}

export default function InfoBar({ score, timer, lives }: InfoBarProps) {
    return (
        <div className="flex justify-center items-center mb-3 font-bold bg-[#624b99] shadow-2xl rounded-2xl px-4 py-2 gap-16 w-[400px] mx-auto z-10">
            <div className="flex flex-col items-center">
                <span className="md:text-sm text-xs text-amber-300 leading-tight">Skor</span>
                <span className="text-[#f7f4ff] leading-tight">{score}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="md:text-sm text-xs text-amber-300 leading-tight">Waktu</span>
                <span className="text-[#f7f4ff] leading-tight">{formatTimer(timer)}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="md:text-sm text-xs text-amber-300 leading-tight">Nyawa</span>
                <span className="text-[#f7f4ff] leading-tight">{renderLives(lives)}</span>
            </div>
        </div>
    );
}
