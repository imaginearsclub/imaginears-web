"use client";

import { useMemo, useState } from "react";
import PlayerTable, { Player } from "@/components/admin/PlayerTable";

const INITIAL_PLAYERS: Player[] = [
    {
        id: "p1",
        name: "Mickey Mouse",
        email: "mickey@imaginears.club",
        role: "Player",
        status: "Active",
        createdAt: new Date().toISOString(),
    },
    {
        id: "p2",
        name: "Minnie Mouse",
        email: "minnie@imaginears.club",
        role: "Player",
        status: "Active",
        createdAt: new Date().toISOString(),
    },
];

export default function PlayersPage() {
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<Player[]>(INITIAL_PLAYERS);

    const filtered = useMemo(() => {
        if (!query.trim()) return rows;
        const q = query.toLowerCase();
        return rows.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                r.status.toLowerCase().includes(q)
        );
    }, [rows, query]);

    return (
        <section className="band">
            <div className="container py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="section-title text-2xl md:text-3xl">Players</h1>
                    <div className="flex items-center gap-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search players…"
                            className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 outline-none focus:ring-2 focus:ring-brandStart/50"
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() =>
                                setRows((prev) => [
                                    ...prev,
                                    {
                                        id: `p${prev.length + 1}`,
                                        name: `Player ${prev.length + 1}`,
                                        email: `player${prev.length + 1}@example.com`,
                                        role: "Player",
                                        status: "Active",
                                        createdAt: new Date().toISOString(),
                                    },
                                ])
                            }
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="mt-5 card overflow-hidden">
                    <div className="card-content p-0">
                        <PlayerTable rows={filtered} />
                    </div>
                </div>
            </div>
        </section>
    );
}
