import clsx from 'clsx';

type Props = {
    children: React.ReactNode;
    isCountdown: boolean;
    flashError: boolean;
    isMuted?: boolean;
};

export default function TerbilangBox({ children, isCountdown, flashError, isMuted }: Props) {
    // 1. Logika untuk menentukan class CSS secara dinamis
    const boxClassName = clsx(
        'terbilang-box',
        {
            'bg-red-300': flashError,
            'bg-[#faf8ff]': !flashError,
            // Ganti kondisi ini dari isCountdown menjadi isMuted
            'text-gray-400': isMuted,
        }
    );

    return (
        <div className="w-full mb-4 px-4">
            <div className="terbilang-container">
                <div className={boxClassName}>
                    {isCountdown ? "Bersiap..." : children}
                </div>
            </div>
        </div>
    );
}