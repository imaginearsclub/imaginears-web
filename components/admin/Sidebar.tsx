"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CalendarRange,
    FileText,
    Users,
    Settings,
    Building2,
    X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import SignOutButton from "./SignOutButton";

const CURRENT_YEAR = new Date().getFullYear();

/* ---------- Nav Item ---------- */
const NavItem = memo(function NavItem({
    href,
    icon: Icon,
    label,
    onClick,
}: {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
}) {
    const pathname = usePathname();
    
    // Memoize active state calculation
    const active = useMemo(() => {
        return pathname === href || pathname.startsWith(`${href}/`);
    }, [pathname, href]);

    // Memoize click handler to prevent re-creation
    const handleClick = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <Link
            href={href}
            onClick={handleClick}
            className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                active
                    ? "bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 text-slate-900 dark:text-white shadow-sm border border-blue-200/60 dark:border-blue-800/60 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
            )}
            aria-current={active ? "page" : undefined}
        >
            {/* Active indicator */}
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[var(--brand-start)] to-[var(--brand-end)] rounded-r-full" />
            )}
            
            <Icon
                className={cn(
                    "h-5 w-5 transition-all duration-200 flex-shrink-0",
                    active
                        ? "text-[var(--brand-end)]"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-[var(--brand-start)] group-hover:scale-110"
                )}
                aria-hidden="true"
            />
            <span className="font-medium text-sm">{label}</span>
        </Link>
    );
});

/* ---------- Sidebar Inner ---------- */
const SidebarInner = memo(function SidebarInner({ 
    onCloseAction 
}: { 
    onCloseAction?: () => void 
}) {
    // Memoize close handler
    const handleClose = useCallback(() => {
        onCloseAction?.();
    }, [onCloseAction]);

    return (
        <aside className="flex h-full w-full flex-col justify-between p-5">
            {/* Top section */}
            <div className="space-y-2">
                {/* Brand Header */}
                <div className="flex items-center justify-between mb-4">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2.5 group"
                        onClick={handleClose}
                    >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[var(--brand-start)] to-[var(--brand-end)] shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">IA</span>
                        </div>
                        <div>
                            <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                                Imaginears
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                                Admin Portal
                            </div>
                        </div>
                    </Link>
                    {onCloseAction && (
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Close menu"
                            type="button"
                            onClick={handleClose}
                        >
                            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Main Navigation */}
                <nav aria-label="Main navigation" className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
                        Main
                    </div>
                    <NavItem 
                        href="/admin/dashboard" 
                        icon={LayoutDashboard} 
                        label="Dashboard" 
                        onClick={handleClose} 
                    />
                    <NavItem 
                        href="/admin/events" 
                        icon={CalendarRange} 
                        label="Events" 
                        onClick={handleClose} 
                    />
                    <NavItem 
                        href="/admin/applications" 
                        icon={FileText} 
                        label="Applications" 
                        onClick={handleClose} 
                    />
                    
                    {/* Management Section */}
                    <div className="pt-3">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
                            Management
                        </div>
                        <NavItem 
                            href="/admin/players" 
                            icon={Users} 
                            label="Players" 
                            onClick={handleClose} 
                        />
                        <NavItem 
                            href="/admin/organizations" 
                            icon={Building2} 
                            label="Organizations" 
                            onClick={handleClose} 
                        />
                    </div>

                    {/* System Section */}
                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
                            System
                        </div>
                        <NavItem 
                            href="/admin/settings" 
                            icon={Settings} 
                            label="Settings" 
                            onClick={handleClose} 
                        />
                    </div>
                </nav>
            </div>

            {/* Bottom section */}
            <div className="mt-6 space-y-3 border-t border-slate-200/70 dark:border-slate-800/70 pt-4">
                <SignOutButton />
                
                <div className="flex items-center justify-center gap-2 text-[11px]">
                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold">
                        v1.0.0
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">{CURRENT_YEAR}</span>
                </div>
            </div>
        </aside>
    );
});

/* ---------- Desktop Sidebar ---------- */
export const SidebarDesktop = memo(function SidebarDesktop() {
    return (
        <div className="hidden md:block sticky top-4">
            <div className="card overflow-hidden backdrop-blur-sm">
                <div className="card-content p-0">
                    <SidebarInner />
                </div>
            </div>
        </div>
    );
});

/* ---------- Mobile Drawer Sidebar ---------- */
export const SidebarDrawer = memo(function SidebarDrawer({
    open,
    onCloseAction,
}: {
    open: boolean;
    onCloseAction: () => void;
}) {
    // Lock body scroll when drawer is open (security & UX improvement)
    useEffect(() => {
        if (open) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [open]);

    // Close on Escape key (accessibility & UX)
    useEffect(() => {
        if (!open) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCloseAction();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onCloseAction]);

    // Memoize backdrop click handler
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCloseAction();
        }
    }, [onCloseAction]);

    // Prevent interaction when closed
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-200"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                aria-hidden="true"
            />
            
            {/* Drawer Panel */}
            <div
                className={cn(
                    "absolute top-0 bottom-0 left-0 w-[18rem] max-w-[85%]",
                    "bg-white dark:bg-slate-900",
                    "shadow-2xl",
                    "animate-in slide-in-from-left duration-300",
                    "overflow-y-auto"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <SidebarInner onCloseAction={onCloseAction} />
            </div>
        </div>
    );
});
