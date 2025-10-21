const faqs = [
    {
        q: "Is this affiliated with Disney?",
        a: "No. Imaginears Club is a fan project and is not affiliated with The Walt Disney Company."
    },
    {
        q: "Do I need mods to join?",
        a: "No mods are required for Java edition; resource packs are delivered in-game when needed."
    },
    {
        q: "Is it kid-friendly?",
        a: "Yes—we keep it family-friendly with active moderation and clear community guidelines."
    }
];

export default function FAQ() {
    return (
        <section className="band-alt">
            <div className="container py-12 md:py-16">
                <h2 className="section-title text-2xl md:text-3xl font-bold">FAQ</h2>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {faqs.map((f) => (
                        <div key={f.q} className="card card-glass">
                            <h3 className="text-lg font-semibold">{f.q}</h3>
                            <p className="mt-2 text-body">{f.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
