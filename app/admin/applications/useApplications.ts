import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    ApplicationRow,
    AppRole,
    AppStatus,
} from "@/components/admin/applications/ApplicationTable";

type Query = {
    status?: AppStatus | "";
    q?: string;
};

function transformApplicationData(items: Array<Record<string, unknown>>): ApplicationRow[] {
    return items.map((it) => ({
        id: it["id"] as string,
        name: it["name"] as string,
        email: it["email"] as string,
        role: it["role"] as AppRole,
        status: it["status"] as AppStatus,
        submittedAt: it["createdAt"] as string,
        notes: (it["notes"] ?? "") as string,
    }));
}

function buildQueryParams(dq: string, dStatus: Query["status"]): URLSearchParams {
    const params = new URLSearchParams();
    if (dq) params.set("q", dq);
    if (dStatus) params.set("status", dStatus);
    params.set("take", "100");
    return params;
}

export function useApplications() {
    const [rows, setRows] = useState<ApplicationRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Raw inputs
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<Query["status"]>("" as Query["status"]);

    // Debounced inputs
    const [dq, setDQ] = useState("");
    const [dStatus, setDStatus] = useState<Query["status"]>("");

    // Track component mounted state and active fetch
    const mountedRef = useRef(true);
    const abortRef = useRef<AbortController | null>(null);
    const reqSeqRef = useRef(0);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; abortRef.current?.abort(); };
    }, []);

    useEffect(() => {
        const handle = setTimeout(() => { setDQ(q.trim().slice(0, 200)); setDStatus(status ?? ""); }, 300);
        return () => clearTimeout(handle);
    }, [q, status]);

    const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const seq = ++reqSeqRef.current;

        try {
            const params = buildQueryParams(dq, dStatus);
            const res = await fetch(`/api/admin/applications?${params.toString()}`, 
                { cache: "no-store", signal: controller.signal });
            
            if (!res.ok) {
                let message = `Request failed (${res.status})`;
                try {
                    const text = await res.text();
                    if (text) message = text;
                } catch {
                    // Ignore text parsing errors
                }
                throw new Error(message);
            }

            const data = (await res.json()) as { items?: unknown[] };
            const items = Array.isArray(data.items) ? data.items : [];
            if (reqSeqRef.current === seq && mountedRef.current) {
                setRows(transformApplicationData(items as Array<Record<string, unknown>>));
            }
        } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return;
            if (mountedRef.current) setError(e instanceof Error ? e.message : "Failed to load applications.");
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [dq, dStatus]);

    useEffect(() => { load(); }, [load]);

    const updateRowLocal = useCallback((id: string, patch: Partial<ApplicationRow>) => {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    }, []);

    const patch = useCallback(async (id: string, body: unknown) => {
        const res = await fetch(`/api/admin/applications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            let message = `Failed to update (${res.status})`;
            try {
                const text = await res.text();
                if (text) message = text;
            } catch {
                // Ignore text parsing errors
            }
            throw new Error(message);
        }
        return res.json();
    }, []);

    return {
        rows,
        setRows,
        loading,
        error,
        q,
        setQ,
        status,
        setStatus,
        load,
        byId,
        updateRowLocal,
        patch,
    };
}

