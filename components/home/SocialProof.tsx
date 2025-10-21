import Image from "next/image";
import { memo } from "react";

const LOGOS = [
    { src: "/icons/discord.svg", alt: "Discord", label: "Discord community", href: "https://imaginears.club/d" },
    { src: "/icons/youtube.svg", alt: "YouTube", label: "Ride POVs", href: "https://www.youtube.com/@imaginearsclub" },
] as const;

function SocialProof() {
    return (
        <section className="band-alt" aria-label="Community and social proof">
            <div className="container py-8 md:py-10">
                <div className="card card-glass flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-body">
                        Join thousands of players who’ve experienced our magical parks.
                    </p>
                    <div className="flex items-center gap-6 opacity-90">
                        {LOGOS.map((logo) => (
                            <a
                                key={logo.label}
                                href={logo.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label={logo.alt}
                            >
                                <Image
                                    src={logo.src}
                                    width={20}
                                    height={20}
                                    alt={logo.alt}
                                    loading="lazy"
                                    sizes="20px"
                                    draggable={false}
                                />
                                <span className="text-sm text-body underline decoration-transparent hover:decoration-current">
                                    {logo.label}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}export default memo(SocialProof);
