import { toast } from "sonner";

// Security: Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Security: Rate limiting for actions (per action type)
const ACTION_COOLDOWN = 1000; // 1 second between actions

// Security: Sanitize player names to prevent injection
function sanitizePlayerName(name: string): string {
    return name.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

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

// Security: Handle API errors safely
function handleApiError(error: unknown, actionName: string): string {
    if (error instanceof Error) {
        if (error.message === 'Request timeout') {
            return "Action timed out. Please try again.";
        }
        if (error.message.length < 100) {
            return error.message;
        }
    }
    return `Failed to ${actionName.toLowerCase()} player`;
}

// Performance & Security: Execute player action with validation and rate limiting
export async function executePlayerAction(params: {
    endpoint: string;
    playerName: string;
    actionName: string;
    lastActionRef: React.MutableRefObject<Record<string, number>>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    setActionLoading: (arg: boolean) => void;
    loadPlayers: () => Promise<void>;
    shouldRefresh: boolean;
}): Promise<{ success: boolean; message: string }> {
    const { endpoint, playerName, actionName, lastActionRef, setActionLoading, loadPlayers, shouldRefresh } = params;
    
    const sanitizedName = sanitizePlayerName(playerName);
    if (!sanitizedName) {
        return { success: false, message: "Invalid player name" };
    }
    
    const now = Date.now();
    const actions = lastActionRef.current;
    // eslint-disable-next-line security/detect-object-injection
    const lastAction = actions[actionName] ?? 0;
    if (now - lastAction < ACTION_COOLDOWN) {
        return { success: false, message: "Please wait before performing another action" };
    }
    
    setActionLoading(true);
    // eslint-disable-next-line security/detect-object-injection
    actions[actionName] = now;
    
    try {
        const res = await fetchWithTimeout(
            `/api/admin/players/${endpoint}`,
            {
                method: "POST",
                credentials: "include",
                headers: { 
                    "Content-Type": "application/json",
                    "X-Request-Time": now.toString(),
                },
                body: JSON.stringify({ playerName: sanitizedName }),
            },
            REQUEST_TIMEOUT
        );

        if (!res.ok) {
            const error = await res.json().catch(() => null);
            if (error?.error && typeof error.error === 'string') {
                throw new Error(error.error);
            }
            throw new Error(`Action failed`);
        }

        if (shouldRefresh) {
            await loadPlayers();
        }
        
        return { success: true, message: sanitizedName };
    } catch (error) {
        return { success: false, message: handleApiError(error, actionName) };
    } finally {
        setActionLoading(false);
    }
}

// Create action handler that shows appropriate toast messages
export function createPlayerActionHandler(
    endpoint: string,
    actionName: string,
    successMessageTemplate: string,
    shouldRefresh: boolean
) {
    return async (
        name: string,
        actionLoading: boolean,
        lastActionRef: React.MutableRefObject<Record<string, number>>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        setActionLoading: (arg: boolean) => void,
        loadPlayers: () => Promise<void>
    ) => {
        if (actionLoading) return;
        
        const result = await executePlayerAction({
            endpoint,
            playerName: name,
            actionName,
            lastActionRef,
            setActionLoading,
            loadPlayers,
            shouldRefresh,
        });
        
        if (result.success) {
            toast.success(successMessageTemplate.replace('{name}', result.message));
        } else {
            toast.error(result.message);
        }
    };
}

