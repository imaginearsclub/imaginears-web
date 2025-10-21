export default function ServerCTA() {
    return (
        <section
            className="relative isolate overflow-hidden band"
            data-surface="image"
        >
            {/* Soft gradient background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brandStart/25 to-brandEnd/25 dark:from-brandStart/15 dark:to-brandEnd/15" />

            <div className="container py-12 md:py-16 relative z-10">
                <div className="card card-glass flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                    <div className="grow">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white drop-shadow-sm">
                            Ready to visit the parks?
                        </h2>
                        <p className="mt-2 text-body">
                            Add the server IP in Minecraft Java and hop in—our guides and mods
                            are happy to help you get started!
                        </p>
                        <ul className="mt-4 text-sm text-body list-disc pl-5 space-y-1">
                            <li>
                                IP: <span className="font-semibold">imaginears.club</span>
                            </li>
                            <li>Recommended: Java 1.20.x+</li>
                            <li>Join our Discord for updates and support</li>
                        </ul>
                    </div>

                    <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                        <a
                            href="minecraft://?addExternalServer=Imaginears%20Club|imaginears.club:25565"
                            className="btn-gradient text-center"
                        >
                            Add Server
                        </a>
                        <a
                            href="https://imaginears.club/d"
                            target="_blank"
                            rel="noreferrer"
                            className="btn-gradient text-center"
                        >
                            Join Discord
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
