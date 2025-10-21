"use client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
    >
        {children}
    </Link>
);

export default function Header() {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 bg-[linear-gradient(180deg,rgba(142,207,255,0.20)_0%,rgba(255,255,255,0.65)_100%)] dark:bg-[linear-gradient(180deg,rgba(13,23,40,0.85)_0%,rgba(10,15,25,0.60)_100%)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-3" aria-label="Imaginears Club home">
                    <Image src="/images/logo.webp" width={36} height={36} alt="Imaginears Club" />
                    <span className="font-bold tracking-wide text-slate-800 dark:text-white">Imaginears Club</span>
                </Link>

                <nav className="flex items-center gap-6">
                    <NavLink href="/events">Events</NavLink>
                    <NavLink href="/about">About</NavLink>
                    <NavLink href="/apply">Apply</NavLink>
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
