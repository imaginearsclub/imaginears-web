"use client";

import PlayerTable, { type Player } from "@/components/admin/PlayerTable";

// Mock data - will be replaced with live database feed
const MOCK_PLAYERS: Player[] = [
    {
        name: "Steve",
        rank: "Member",
        server: "Adventure World",
        online: true,
        joinedAt: "2024-01-15",
    },
    {
        name: "Alex",
        rank: "Creator",
        server: "Creative Hub",
        online: true,
        joinedAt: "2024-02-10",
    },
    {
        name: "Herobrine",
        rank: "Staff",
        server: "Admin Lounge",
        online: false,
        joinedAt: "2023-12-01",
    },
    {
        name: "Notch",
        rank: "Staff",
        server: "Development Lab",
        online: true,
        joinedAt: "2023-11-20",
    },
    {
        name: "Enderman",
        rank: "Member",
        server: "The End",
        online: false,
        joinedAt: "2024-03-05",
    },
];

export default function PlayersPage() {
    // Player actions - these will eventually connect to your backend
    const handleMute = async (name: string) => {
        console.log(`Muting player: ${name}`);
        // TODO: Connect to backend API
    };

    const handleKick = async (name: string) => {
        console.log(`Kicking player: ${name}`);
        // TODO: Connect to backend API
    };

    const handleTeleport = async (name: string) => {
        console.log(`Teleporting to player: ${name}`);
        // TODO: Connect to backend API
    };

    return (
        <section className="band">
            <div className="container py-6">
                <div className="flex flex-col gap-4">
                    <h1 className="section-title text-2xl md:text-3xl">Players</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Live feed from Minecraft server • Updates automatically
                    </p>
                </div>

                <div className="mt-6">
                    <PlayerTable
                        rows={MOCK_PLAYERS}
                        onMute={handleMute}
                        onKick={handleKick}
                        onTeleport={handleTeleport}
                    />
                </div>
            </div>
        </section>
    );
}
