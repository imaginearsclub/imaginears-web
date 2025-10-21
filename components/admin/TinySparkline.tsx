export default function TinySparkline({ values }: { values: number[] }) {
    // Normalize to 0-100 for a simple inline SVG
    const max = Math.max(...values, 1);
    const pts = values
        .map((v, i) => {
            const x = (i / (values.length - 1)) * 100;
            const y = 100 - (v / max) * 100;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg viewBox="0 0 100 100" className="w-full h-12">
            <polyline
                points={pts}
                fill="none"
                stroke="url(#grad)"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--brand-start)" />
                    <stop offset="100%" stopColor="var(--brand-end)" />
                </linearGradient>
            </defs>
        </svg>
    );
}
