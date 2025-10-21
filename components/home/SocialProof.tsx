import Image from "next/image";
import { memo } from "react";

const LOGOS = [
    { src: "/icons/discord.svg", alt: "Discord", label: "Discord community" },
    { src: "/icons/youtube.svg", alt: "YouTube", label: "Ride POVs" },
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
                            <div key={logo.label} className="flex items-center gap-2">
                                <Image
                                    src={logo.src}
                                    width={20}
                                    height={20}
                                    alt={logo.alt}
                                    loading="lazy"
                                    sizes="20px"
                                    draggable={false}
                                />
                                <span className="text-sm text-body">{logo.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(SocialProof);
