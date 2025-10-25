import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Frequently Asked Questions | Imaginears Club",
    description: "Find answers to common questions about Imaginears Club - a Disney-inspired Minecraft server. Learn about joining, events, applications, and more.",
    keywords: ["FAQ", "questions", "help", "support", "Imaginears", "Minecraft server", "Disney Minecraft"],
    openGraph: {
        title: "FAQ | Imaginears Club",
        description: "Find answers to common questions about our Disney-inspired Minecraft server.",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "FAQ | Imaginears Club",
        description: "Find answers to common questions about our Disney-inspired Minecraft server.",
    },
};

export default function FAQLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

