"use client";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ExpandableProps {
    isOpen: boolean;
    children: React.ReactNode;
    duration?: number; // optional: durasi animasi
}

export default function Expandable({
    isOpen,
    children,
    duration = 0.4,
}: ExpandableProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    // ukur ulang tinggi kalau konten berubah
    useEffect(() => {
        if (ref.current) {
            setHeight(ref.current.scrollHeight);
        }
    }, [isOpen, children]);

    return (
        <motion.div
            initial={false}
            animate={{ height: isOpen ? height : 0 }}
            transition={{ duration, ease: "easeInOut" }}
            className="overflow-hidden"
        >
            <div ref={ref}>{children}</div>
        </motion.div>
    );
}
