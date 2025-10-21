"use client";

import { useEffect, useRef, useState } from "react";

export default function RowActions({
                                       name,
                                       online,
                                       onMute,
                                       onKick,
                                       onTeleport,
                                   }: {
    name: string;
    online: boolean;
    onMute: () => void;
    onKick: () => void;
    onTeleport: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // close on outside click
    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
                className="rounded-xl px-3 py-2 text-sm border border-slate-200/60 dark:border-slate-800/60
                   bg-white/70 dark:bg-slate-900/70 hover:brightness-105"
            >
                ⋮
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200/60 dark:border-slate-800/60
                     bg-white dark:bg-slate-900 shadow-lg z-10 overflow-hidden"
                >
                    <button
                        role="menuitem"
                        onClick={() => { setOpen(false); onMute(); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        🔇 Mute (10m)
                    </button>

                    <button
                        role="menuitem"
                        disabled={!online}
                        onClick={() => { setOpen(false); onKick(); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800
                        ${online ? "" : "opacity-50 cursor-not-allowed"}`}
                    >
                        👢 Kick
                    </button>

                    <button
                        role="menuitem"
                        onClick={() => { setOpen(false); onTeleport(); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        🧭 Teleport to Hub
                    </button>
                </div>
            )}
        </div>
    );
}
