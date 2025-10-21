import { prisma } from "@/lib/prisma";
import EventsPublicFilter from "@/components/public/EventsPublicFilter";

export const revalidate = 300; // ISR to keep page fast while staying fresh

export default async function EventsListingPage() {
    // Pull only the fields the filter/grid needs for performance
    const events = await prisma.event.findMany({
        where: { status: { in: ["Scheduled", "Published"] } },
        orderBy: [{ startAt: "asc" }, { title: "asc" }],
        select: {
            id: true,
            title: true,
            world: true,
            startAt: true,
            endAt: true,
            status: true,
            category: true,
            shortDescription: true,
        },
    });

    return (
        <section className="band">
            <div className="container py-10">
                <h1 className="text-3xl font-bold mb-4">Events</h1>
                <p className="text-body dark:text-slate-300 mb-6">
                    Browse upcoming happenings across the resort.
                </p>

                <EventsPublicFilter events={events as any} />
            </div>
        </section>
    );
}
