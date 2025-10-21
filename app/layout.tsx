import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";


export const metadata: Metadata = {
    title: "Imaginears Club",
    description: "A magical Disney‑inspired Minecraft experience",
    openGraph: { title: "Imaginears Club", images: ["/og.png"] }
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-dvh grid grid-rows-[auto_1fr_auto]">
        <Header />
        <main>{children}</main>
        <Footer />
        </body>
        </html>
    );
}
