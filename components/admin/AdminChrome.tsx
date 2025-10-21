"use client";

import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import { SidebarDesktop, SidebarDrawer } from "@/components/admin/Sidebar";

export default function AdminChrome({ children }: { children: ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur">
                <div className="container flex items-center justify-between py-3">
                    <button
                        className="md:hidden btn btn-icon btn-ghost"
                        aria-label="Open menu"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <h1 className="text-base md:text-lg font-semibold tracking-tight">
                        Admin
                        <span className="ml-2 text-slate-500 dark:text-slate-400 hidden sm:inline">
              / {process.env.NODE_ENV === "development" ? "Dev" : "Live"}
            </span>
                    </h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="container py-6">
                <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-6">
                    {/* Desktop-only sidebar */}
                    <SidebarDesktop />

                    {/* Page content */}
                    <section>{children}</section>
                </div>
            </main>

            {/* Mobile drawer (separate component) */}
            <SidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
        </div>
    );
}
