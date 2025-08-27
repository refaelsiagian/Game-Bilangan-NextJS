"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface Option {
    value: string;
    name: string;
    desc: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}

export default function Select({ options, value, onChange }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [direction, setDirection] = useState<"up" | "down">("down");
    const [position, setPosition] = useState<{ top: number; left: number; width: number }>({
        top: 0,
        left: 0,
        width: 0,
    });
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const dropdownRef = useRef<HTMLUListElement | null>(null); // <-- Ref untuk dropdown
    const dropdownHeightRef = useRef(0);

    // == Ukur tinggi dropdown saat mount untuk prediksi posisi
    useEffect(() => {
        if (dropdownRef.current) {
            dropdownHeightRef.current = dropdownRef.current.scrollHeight;
        }
    }, []);


    // == Klik di luar select
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node | null;
            // Klik berada di dalam button atau di dalam dropdown, jangan close
            if (
                (buttonRef.current && buttonRef.current.contains(target)) ||
                (dropdownRef.current && dropdownRef.current.contains(target))
            ) {
                return;
            }
            setOpen(false);
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    // == Atur posisi dropdown saat dibuka ==
    const handleToggle = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const dropdownHeight = dropdownHeightRef.current || 200; // Fallback kalau belum diukur

            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                setDirection("up");
                setPosition({
                    top: rect.top - dropdownHeight + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            } else {
                setDirection("down");
                setPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }

            setOpen(prev => !prev); // Buka dropdown
        }
    };

    const selected = options.find((opt) => opt.value === value);

    return (
        <>
            {/* Tombol select */}
            <button
                ref={buttonRef}
                type="button"
                className="w-40 bg-[#dbccff] text-left px-3 py-2 rounded-lg shadow hover:bg-[#d2bfff] transition flex justify-between items-center"
                onClick={handleToggle}
            >
                {selected ? selected.name : "Pilih Kesulitan"}
                <ChevronDown size={16} />
            </button>

            {/* Daftar option via portal */}
            {open &&
                createPortal(
                    <ul
                        ref={dropdownRef} // <-- Pasang ref untuk dropdown
                        className="absolute bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] overflow-hidden"
                        style={{
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            position: "absolute",
                        }}
                    >
                        {options.map((opt) => (
                            <li
                                key={opt.value}
                                className="px-3 py-2 cursor-pointer hover:bg-[#dbccff]"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                            >
                                <div className="font-medium">{opt.name}</div>
                                <div className="text-xs text-gray-500">{opt.desc}</div>
                            </li>
                        ))}
                    </ul>,
                    document.body
                )}
        </>
    );
}
