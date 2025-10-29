"use client";

import PlayerTable from "@/components/admin/PlayerTable";
import { Button, Card, CardContent } from "@/components/common";
import { PageHeader } from "@/components/admin/PageHeader";
import { Users, RefreshCw } from "lucide-react";
import { usePlayers } from "./usePlayers";
import { PlayersStats } from "./PlayersStats";

export default function PlayersPage() {
    const { players, loading, loadPlayers, handleMute, handleKick, handleTeleport } = usePlayers();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Minecraft Players"
                description="Monitor and manage online players • Updates every 30s"
                icon={<Users className="w-6 h-6" />}
                badge={{ label: `${players.length} Players`, variant: "success" }}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin/dashboard" },
                    { label: "Players" }
                ]}
                actions={
                    <Button 
                        variant="primary" 
                        size="md"
                        onClick={loadPlayers}
                        isLoading={loading}
                        loadingText="Refreshing..."
                        leftIcon={<RefreshCw />}
                        ariaLabel="Refresh player list"
                    >
                        Refresh
                    </Button>
                }
            />

            <div className="space-y-6">
                <PlayersStats players={players} />

                <Card accent="success" variant="elevated">
                    <CardContent className="p-0">
                        <PlayerTable
                            rows={players}
                            onMute={handleMute}
                            onKick={handleKick}
                            onTeleport={handleTeleport}
                            isLoading={loading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
