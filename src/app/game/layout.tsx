import { GameProvider } from "./_context/GameContext";
import InfoBar from "./_components/InfoBar";

// Layout menjadi Server Component yang sederhana
export default function GameLayout({ children }: { children: React.ReactNode }) {
    return (
        <GameProvider>
            <main className={`container mx-auto py-6 relative`}>
                <InfoBar />
                {children}
            </main>
        </GameProvider>
    );
}