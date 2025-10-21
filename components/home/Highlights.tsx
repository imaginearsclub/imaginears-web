export default function Highlights() {
    const items = [
        { title: "Daily Shows", body: "Catch recurring shows with countdowns and park-wide audio." },
        { title: "Ride the Classics", body: "Tron Lightcycle Run, Mine Train, Star Tours, and more." },
        { title: "Seasonal Magic", body: "Special overlays and limited-time events all year." }
    ];

    return (
        <section className="band">
            <div className="container py-12 md:py-16">
                <h2 className="section-title text-2xl md:text-3xl font-bold">Why players love it</h2>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((it) => (
                        <div
                            key={it.title}
                            className="card card-glass duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <h3 className="text-xl font-semibold">{it.title}</h3>
                            <p className="mt-2 text-slate-700 dark:text-slate-300">{it.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
