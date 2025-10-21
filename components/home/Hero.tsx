import Image from "next/image";
import Link from "next/link";
import castle from "@/public/images/hero/castle.webp";

export default function Hero() {
    return (
        <section
            className="relative isolate overflow-hidden band-alt"
            data-surface="image"
        >
            {/* Background image */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src={castle}
                    alt="Castle at night with fireworks"
                    fill
                    priority
                    className="object-cover"
                    placeholder="blur"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-white/0 dark:to-slate-950/45" />
            </div>

            <div className="container py-20 md:py-28 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow">
                    Imaginears Club
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-white/90 drop-shadow">
                    A Disney-inspired Minecraft world brought to life—rides, shows, and
                    seasonal events crafted by fans for fans. Family-friendly, welcoming,
                    and always magical. ✨
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                    <Link href="/events" className="btn-gradient">
                        See Events
                    </Link>
                    <a
                        href="https://imaginears.club/d"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-gradient"
                    >
                        Join Discord
                    </a>
                </div>

                {/* Quick Facts */}
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="card card-glass">
                        <p className="text-sm muted">Server IP</p>
                        <p className="mt-1 text-xl font-semibold">imaginears.club</p>
                    </div>
                    <div className="card card-glass">
                        <p className="text-sm muted">Version</p>
                        <p className="mt-1 text-xl font-semibold">Java 1.20.x+</p>
                    </div>
                    <div className="card card-glass">
                        <p className="text-sm muted">Status</p>
                        <p className="mt-1 text-xl font-semibold">Online • Community-run</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
