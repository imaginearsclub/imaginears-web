import { useEffect, useState, useCallback, useRef } from "react";
import type { Player } from "@/components/admin/PlayerTable";
import { toast } from "sonner";
import { createPlayerActionHandler } from "./playerActions";

// Security: Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Performance: Create fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

export function usePlayers() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Performance: Track last action time for rate limiting
    const lastActionTime = useRef<Record<string, number>>({});
    
    // Performance: AbortController for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);

    // Performance: Memoized load function
    const loadPlayers = useCallback(async () => {
        try {
            // Cancel previous request if still pending
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            abortControllerRef.current = new AbortController();
            
            const res = await fetchWithTimeout(
                "/api/admin/players",
                { 
                    cache: "no-store",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" }
                },
                REQUEST_TIMEOUT
            );
            
            if (!res.ok) {
                // Security: Don't expose status codes to user
                throw new Error("Failed to fetch");
            }
            
            const data = await res.json();
            
            // Security: Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error("Invalid response");
            }
            
            setPlayers(Array.isArray(data.players) ? data.players : []);
        } catch (error) {
            // Security: Generic error message
            if (error instanceof Error && error.message !== 'Request timeout') {
                toast.error("Unable to load player data");
            } else {
                toast.error("Request timed out. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPlayers();
        const interval = setInterval(loadPlayers, 30000);
        return () => {
            clearInterval(interval);
            // Performance: Cancel pending requests on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadPlayers]);

    // Performance: Create memoized action handlers
    const muteHandler = createPlayerActionHandler("mute", "Mute", "{name} has been muted", true);
    const kickHandler = createPlayerActionHandler("kick", "Kick", "{name} has been kicked from the server", true);
    const teleportHandler = createPlayerActionHandler("teleport", "Teleport", "Teleporting to {name}...", false);

    const handleMute = useCallback(
        (name: string) => muteHandler(name, actionLoading, lastActionTime, setActionLoading, loadPlayers),
        [actionLoading, loadPlayers, muteHandler]
    );

    const handleKick = useCallback(
        (name: string) => kickHandler(name, actionLoading, lastActionTime, setActionLoading, loadPlayers),
        [actionLoading, loadPlayers, kickHandler]
    );

    const handleTeleport = useCallback(
        (name: string) => teleportHandler(name, actionLoading, lastActionTime, setActionLoading, loadPlayers),
        [actionLoading, loadPlayers, teleportHandler]
    );

    return {
        players,
        loading,
        loadPlayers,
        handleMute,
        handleKick,
        handleTeleport,
    };
}

