import { useEffect, useState } from "react";
import { log } from "@/lib/logger";

export type Kpi = { 
    totalPlayers: number; 
    totalEvents: number; 
    activeApplications: number; 
    apiUptime: string;
    trends: {
        players: string;
        events: string;
        applications: string;
    };
    server: {
        address: string;
        online: boolean;
        version?: string;
        players: {
            online: number;
            max: number;
        };
        latency?: number;
        uptimePercentage: number | null;
        playerHistory: { timestamp: number; count: number }[];
        error?: string;
    };
};

export type ActivityItem = { 
    id: string; 
    kind: "event" | "application"; 
    title: string; 
    sub: string; 
    when: string; 
    updatedBy?: string 
};

export function useDashboard() {
    const [kpis, setKpis] = useState<Kpi | null>(null);
    const [events30d, setEvents30d] = useState<{ date: string; count: number }[]>([]);
    const [appsByStatus, setAppsByStatus] = useState<{ status: string; count: number }[]>([]);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setErr(null);
                
                const [kRes, eRes, aRes, actRes] = await Promise.all([
                    fetch("/api/admin/kpis", { credentials: "include" }),
                    fetch("/api/admin/stats/events?range=30", { credentials: "include" }),
                    fetch("/api/admin/stats/applications-by-status", { credentials: "include" }),
                    fetch("/api/admin/activity", { credentials: "include" }),
                ]);

                const k = kRes.ok ? await kRes.json() : null;
                const e = eRes.ok ? await eRes.json() : [];
                const a = aRes.ok ? await aRes.json() : [];
                const act = actRes.ok ? await actRes.json() : [];
                
                setKpis(k);
                setEvents30d(Array.isArray(e) ? e : []);
                setAppsByStatus(Array.isArray(a) ? a : []);
                setActivity(Array.isArray(act) ? act : []);
            } catch (error) {
                log.error("Dashboard: Failed to load stats", { error });
                setErr("Failed to load stats.");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
        const interval = setInterval(loadDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    return {
        kpis,
        events30d,
        appsByStatus,
        activity,
        loading,
        err,
        setErr,
    };
}

