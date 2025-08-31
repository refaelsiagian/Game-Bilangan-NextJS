// utils/numberUtils.ts

// ubah angka ke kata (terbilang)
export function terbilang(num: number): string {
    const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
    const tingkat = ["", "ribu", "juta", "miliar", "triliun"];

    const strNum = num.toString();
    if (strNum === "0") return "nol";

    const result: string[] = [];
    const angka = strNum.split("").reverse().join("");
    const groups = angka.match(/.{1,3}/g) || [];

    for (let i = 0; i < groups.length; i++) {
        const n = groups[i].split("").reverse().join(""); // mis. "10" atau "056"
        const nInt = parseInt(n);
        if (nInt === 0) continue;

        // pad supaya selalu 3 char: "5" -> "005", "10" -> "010", "123" -> "123"
        const padded = n.padStart(3, "0");
        const ratusan = parseInt(padded[0]);
        const puluhan = parseInt(padded[1]);
        let satuanAngka = parseInt(padded[2]);

        const words: string[] = [];

        if (ratusan === 1) words.push("seratus");
        else if (ratusan > 1) words.push(satuan[ratusan] + " ratus");

        if (puluhan > 0) {
            if (puluhan === 1) {
                if (satuanAngka === 0) words.push("sepuluh");
                else if (satuanAngka === 1) words.push("sebelas");
                else words.push(satuan[satuanAngka] + " belas");
                satuanAngka = 0;
            } else {
                words.push(satuan[puluhan] + " puluh");
            }
        }

        if (satuanAngka > 0) words.push(satuan[satuanAngka]);

        // kasus khusus "seribu" (1 di posisi ribu)
        if (i === 1 && nInt === 1) {
            // ganti "satu ribu" menjadi "seribu"
            result.unshift("seribu");
        } else {
            if (words.length > 0) words.push(tingkat[i]);
            result.unshift(words.join(" ").trim());
        }
    }

    return result.join(" ").trim().replace(/\s+/g, " ");
}


// generate angka acak sesuai tingkat kesulitan
export function generateRandomNumberByDifficulty(difficulty: string): string {
    const groups: string[] = [];
    const diff = (difficulty || "sedang").toLowerCase();

    if (diff === "mudah") {
        const easyPatterns = [
            [true, true, true, false, false],
            [false, true, true, true, false],
            [false, false, true, true, true],
        ];
        const pattern = easyPatterns[Math.floor(Math.random() * easyPatterns.length)];
        for (let i = 0; i < 5; i++) {
            groups.push(pattern[i] ? String(Math.floor(Math.random() * 900) + 100) : "000");
        }
        return groups.join("");
    } else if (diff === "sedang") {
        for (let i = 0; i < 5; i++) {
            groups.push(String(Math.floor(Math.random() * 900) + 100));
        }
        return groups.join("");
    } else {
        const digits = new Array(15).fill(null);
        const zeroCount = Math.floor(Math.random() * 5) + 6;
        const zeroPositions: number[] = [];
        while (zeroPositions.length < zeroCount) {
            const pos = Math.floor(Math.random() * 15);
            if (!zeroPositions.includes(pos)) zeroPositions.push(pos);
        }
        zeroPositions.forEach(pos => (digits[pos] = "0"));
        for (let i = 0; i < 15; i++) {
            if (digits[i] === null) digits[i] = String(Math.floor(Math.random() * 9) + 1);
        }
        if (digits[0] === "0" && digits[1] === "0" && digits[2] === "0") {
            const idx = Math.floor(Math.random() * 3);
            digits[idx] = String(Math.floor(Math.random() * 9) + 1);
        }
        return digits.join("");
    }
}

export function findFixedIndices(digits: string[]): number[] {
    const fixedIndices: number[] = [];

    for (let i = 0; i <= digits.length - 3; i += 3) {
        if (digits[i] === '0' && digits[i + 1] === '0' && digits[i + 2] === '0') {
            fixedIndices.push(i, i + 1, i + 2);
            if (fixedIndices.length >= 6) break; // maksimal 2 tripel
        }
    }
    
    return fixedIndices;
}

// Acak urutan array (untuk mode dengan angka acak)
export function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

