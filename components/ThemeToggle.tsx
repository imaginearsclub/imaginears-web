"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
        setDark(prefersDark);
    }, []);

    const toggle = () => {
        setDark((d) => {
            const next = !d;
            document.documentElement.classList.toggle("dark", next);
            return next;
        });
    };

    return (
        <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-full p-2 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <span aria-hidden>{dark ? "☀️" : "🌙"}</span>
        </button>
    );
}
