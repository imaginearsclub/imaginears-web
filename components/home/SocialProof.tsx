import Image from "next/image";

export default function SocialProof() {
    return (
        <section className="band-alt">
            <div className="container py-8 md:py-10">
                <div className="card card-glass flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        Join thousands of players who’ve experienced our magical parks.
                    </p>
                    <div className="flex items-center gap-6 opacity-90">
                        {/* Optional logos — remove if not available */}
                        <div className="flex items-center gap-2">
                            <Image src="/icons/discord.svg" width={20} height={20} alt="Discord" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Discord community</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Image src="/icons/youtube.svg" width={20} height={20} alt="YouTube" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Ride POVs</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
