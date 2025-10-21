"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CalendarRange,
    FileText,
    Users,
    Settings,
    LogOut,
    X,
} from "lucide-react";
import { useEffect } from "react";

/* ---------- Nav Item ---------- */
function NavItem({
                     href,
                     icon: Icon,
                     label,
                     onClick,
                 }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
}) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + "/");

    return (
        <Link
            href={href}
            onClick={onClick}
            className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                active
                    ? "bg-white/70 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/70 dark:border-slate-800/60"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white/50 hover:dark:bg-slate-900/40",
            ].join(" ")}
        >
            <Icon
                className={[
                    "h-5 w-5",
                    active
                        ? "text-[var(--brand-end)]"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-[var(--brand-end)]",
                ].join(" ")}
            />
            <span className="font-medium">{label}</span>
        </Link>
    );
}

/* ---------- Sidebar Inner ---------- */
function SidebarInner({ onClose }: { onClose?: () => void }) {
    return (
        <aside className="flex h-full w-full flex-col justify-between p-4">
            {/* Top section */}
            <div className="space-y-3">
                {/* Brand */}
                <div className="flex items-center justify-between mb-2">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2"
                        onClick={onClose}
                    >
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[var(--brand-start)] to-[var(--brand-end)] shadow-sm" />
                        <div className="text-lg font-bold tracking-tight">
                            Imaginears Admin
                        </div>
                    </Link>
                    {onClose && (
                        <button
                            className="btn btn-icon btn-ghost md:hidden"
                            aria-label="Close menu"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Nav items */}
                <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onClose} />
                <NavItem href="/admin/events" icon={CalendarRange} label="Events" onClick={onClose} />
                <NavItem href="/admin/applications" icon={FileText} label="Applications" onClick={onClose} />
                <NavItem href="/admin/players" icon={Users} label="Players" onClick={onClose} />
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60" />
                <NavItem href="/admin/settings" icon={Settings} label="Settings" onClick={onClose} />
            </div>

            {/* Bottom section */}
            <div className="mt-6 space-y-2">
                <form action="/api/logout" method="post" className="w-full">
                    <button
                        className="btn btn-outline btn-sm w-full justify-center"
                        type="submit"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                    </button>
                </form>

                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-1">
                    v1 • {new Date().getFullYear()}
                </p>
            </div>
        </aside>
    );
}

/* ---------- Desktop Sidebar ---------- */
export function SidebarDesktop() {
    return (
        <div className="hidden md:block sticky top-4">
            <div className="card overflow-hidden">
                <div className="card-content p-0">
                    <SidebarInner />
                </div>
            </div>
        </div>
    );
}

/* ---------- Mobile Drawer Sidebar ---------- */
export function SidebarDrawer({
                                  open,
                                  onClose,
                              }: {
    open: boolean;
    onClose: () => void;
}) {
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <div
            className={[
                "fixed inset-0 z-40 md:hidden transition-opacity",
                open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/40" />
            <div
                className={[
                    "absolute top-0 bottom-0 left-0 w-[18rem] max-w-[85%] bg-[var(--bg-light)] dark:bg-[var(--bg-dark)]",
                    "shadow-2xl transition-transform",
                    open ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
                onClick={(e) => e.stopPropagation()}
            >
                <SidebarInner onClose={onClose} />
            </div>
        </div>
    );
}
