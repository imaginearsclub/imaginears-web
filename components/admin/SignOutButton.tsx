"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/common";

const LOGIN_PATH = "/login";
const TIMEOUT_MS = 8000;

export default function SignOutButton() {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isPending, startTransition] = useTransition();
    const abortRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const handleSignOut = useCallback(async () => {
        // Prevent double-clicks
        if (isSigningOut || isPending) return;
        
        setIsSigningOut(true);

        // Cancel any pending requests
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // Safety timeout to prevent hanging
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const signOutPromise = (async () => {
            try {
                // Call Better-Auth sign-out endpoint
                await fetch("/api/logout", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    credentials: "include",
                    signal: controller.signal,
                });

                // Clear client-side session data (but preserve theme preference in localStorage)
                if (typeof window !== "undefined") {
                    try {
                        // Clear sessionStorage (temporary session data)
                        sessionStorage.clear();
                        
                        // Note: We intentionally don't clear localStorage here
                        // to preserve user preferences like theme that should persist
                    } catch (e) {
                        console.warn("Failed to clear session storage:", e);
                    }
                }

                // Navigate to login (use replace to prevent back button issues)
                startTransition(() => {
                    router.replace(LOGIN_PATH);
                    router.refresh();
                });
            } catch (error) {
                // Even on error, navigate to login for security
                if (!controller.signal.aborted) {
                    console.error("Sign out error:", error);
                }
                
                // Force navigation to login
                if (isMountedRef.current) {
                    try {
                        router.replace(LOGIN_PATH);
                    } catch {
                        window.location.href = LOGIN_PATH;
                    }
                }
                throw error; // Rethrow for toast.promise to catch
            } finally {
                clearTimeout(timeoutId);
                if (isMountedRef.current) {
                    setIsSigningOut(false);
                }
            }
        })();

        toast.promise(signOutPromise, {
            loading: 'Signing out...',
            success: 'Signed out successfully',
            error: 'Sign out failed, redirecting...',
        });

        await signOutPromise;
    }, [isSigningOut, isPending, router]);

    const isLoading = isSigningOut || isPending;

    return (
        <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoading}
            className={cn(
                "w-full inline-flex items-center justify-center gap-2",
                "px-4 py-2.5 text-sm font-medium rounded-xl",
                "border border-slate-300 dark:border-slate-700",
                "bg-white dark:bg-slate-800",
                "text-slate-700 dark:text-slate-200",
                "hover:bg-slate-100 dark:hover:bg-slate-700",
                "hover:border-slate-400 dark:hover:border-slate-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md active:scale-[0.98]"
            )}
            aria-label="Sign out of your account"
            aria-busy={isLoading}
        >
            {isLoading ? (
                <>
                    <Spinner size="sm" variant="current" label="Signing out" />
                    <span>Signing out...</span>
                </>
            ) : (
                <>
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign out</span>
                </>
            )}
        </button>
    );
}
