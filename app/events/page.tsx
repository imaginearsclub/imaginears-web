import { prisma } from "@/lib/prisma";
import EventsPublicFilter from "@/components/public/EventsPublicFilter";
import Link from "next/link";
import { formatInZone, SITE_TZ } from "@/app/utils/timezone";

export default async function EventsListingPage() {
    // Pull all published/scheduled events; tweak order as you like
    const events = await prisma.event.findMany({
        where: { status: { in: ["Scheduled", "Published"] } },
        orderBy: [{ startAt: "asc" }, { title: "asc" }],
    });

    return (
        <section className="band">
            <div className="container py-10">
                <h1 className="text-3xl font-bold mb-4">Events</h1>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Browse upcoming happenings across the resort.
                </p>

                <EventsPublicFilter events={events} />
            </div>
        </section>
    );
}
