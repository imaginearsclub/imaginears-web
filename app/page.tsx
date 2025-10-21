import Hero from "@/components/home/Hero";
import Highlights from "@/components/home/Highlights";
import SocialProof from "@/components/home/SocialProof";
import ServerCTA from "@/components/home/ServerCTA";
import Newsletter from "@/components/home/Newsletter";
import FAQ from "@/components/home/FAQ";
import EventTeaser from "@/components/public/EventTeaser";
import { PrismaClient, EventStatus } from "@prisma/client";


export default function Home() {
    return (
        <>
            <Hero />
            <Highlights />
            <SocialProof />
            <EventTeaser title="Happening Now" limit={3} />
            <ServerCTA />
            <Newsletter />
            <FAQ />
        </>
    );
}
