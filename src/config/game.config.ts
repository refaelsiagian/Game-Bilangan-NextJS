// /config/game.config.ts

// Definisikan tipe data untuk konsistensi (manfaat TypeScript)
export type DifficultySetting = {
    desc: string;
    score: Record<string, number>;
    // Properti lain yang mungkin spesifik untuk difficulty ini, misal: waktu
    timeLimit?: number;
};

export type GameMode = {
    name: string;
    path: string; // URL path, misal: "tulis"
    simpleDesc: string;
    desc: string[];
    difficulty: {
        mudah: DifficultySetting;
        sedang: DifficultySetting;
        sulit: DifficultySetting;
    };
};

// Data utama
export const gameData = {
    cepat: [
        {
            name: "Tulis",
            path: "tulis",
            simpleDesc: "Tuliskan cara baca bilangan yang muncul menggunakan tombol kata yang tersedia.",
            desc: [
                "Sebuah bilangan 15 digit akan muncul di layar.",
                "Gunakan tombol-tombol yang ada untuk merangkai cara bacanya secara lengkap dan benar."
            ],
            difficulty: {
                mudah: {
                    desc: "6 digit dari keseluruhan angka adalah 0.",
                    score: { completed: 100, correct: 5, timeBonus: 1 },
                },
                sedang: {
                    desc: "15 digit terisi secara penuh.",
                    score: { completed: 200, correct: 10, timeBonus: 2 },
                },
                sulit: {
                    desc: "Lebih banyak 0 tersebar acak di seluruh digit.",
                    score: { completed: 300, correct: 15, timeBonus: 3 },
                },
            },
        },
        {
            name: "Pilih",
            path: "pilih",
            simpleDesc: "Pilih tempat yang benar untuk angka yang muncul.",
            desc: [
                "Terdapat 15 slot kosong menggambarkan 15 digit angka. Satu digit angka akan muncul secara acak.",
                "Pilih slot yang benar untuk angka tersebut berdasarkan terbilang yang diberikan.",
            ],
            difficulty: {
                mudah: {
                    desc: "6 digit dari keseluruhan angka sudah terisi.",
                    score: { completed: 100, correct: 5, timeBonus: 1 },
                },
                sedang: {
                    desc: "Tidak ada digit yang terisi.",
                    score: { completed: 200, correct: 10, timeBonus: 2 },
                },
                sulit: {
                    desc: "Buang digit yang tidak termasuk.",
                    score: { completed: 300, correct: 15, timeBonus: 3 },
                },
            },
        },
        // ... mode lain di kategori "cepat"
    ],
    banyak: [
        {
            name: "Cocok",
            path: "cocok",
            simpleDesc: "Tebak bilangan dari petunjuk beberapa digit yang tampil.",
            desc: [
                "Beberapa digit bilangan akan tampil sebagai petunjuk. Terdapat empat pilihan terbilang.",
                "Pilih jawaban terbilang yang cocok dengan digit yang tampil."
            ],
            difficulty: {
                mudah: {
                    desc: "Enam digit adalah 0 dan langsung tampil.",
                    score: { correct: 15 },
                },
                sedang: {
                    desc: "Lima digit tampil sebagai petunjuk.",
                    score: { correct: 25 },
                },
                sulit: {
                    desc: "Bilangan dengan 0 tersebar.",
                    score: { correct: 35 },
                },
            },
        },
        {
            name: "Kedip",
            path: "kedip",
            simpleDesc: "Tebak bilangan dari petunjuk digit yang berkedip sekejap.",
            desc: [
                "Digit angka akan berkedip secara acak sebagai petunjuk.",
                "Pilih jawaban terbilang yang benar menggunakan tombol navigasi, lalu tekan Submit."
            ],
            difficulty: {
                mudah: {
                    desc: "Satu digit berkedip, beberapa digit ditampilkan permanen.",
                    score: { correct: 15 },
                },
                sedang: {
                    desc: "Dua digit berkedip tanpa petunjuk permanen.",
                    score: { correct: 25 },
                },
                sulit: {
                    desc: "Dua digit berkedip, bilangan dengan 0 tersebar.",
                    score: { correct: 35 },
                },
            },
        },
        // ... mode lain di kategori "banyak"
    ],
} as const; // `as const` membuat objek ini read-only