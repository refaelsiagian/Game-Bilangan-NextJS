import { Suspense } from "react";
import GameClientWrapper from "./_context/GameClientWrapper";
import InfoBar from "./_components/InfoBar";

// Layout menjadi Server Component yang sederhana
export default function GameLayout({ children }: { children: React.ReactNode }) {
    return (
        // Di sinilah Suspense diletakkan.
        // Ia membungkus komponen yang butuh data dari URL.
        <Suspense fallback={<LoadingUI />}>
            <GameClientWrapper>
                <main className={`container mx-auto py-6 relative`}>
                    <InfoBar />
                    {children} 
                </main>
            </GameClientWrapper>
        </Suspense>
    );
}

// Komponen untuk ditampilkan selama loading
function LoadingUI() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">
            <p>Mempersiapkan permainan...</p>
        </div>
    );
}