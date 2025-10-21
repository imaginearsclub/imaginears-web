import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
    content: ["./app/**/*.{ts,tsx,md,mdx}", "./components/**/*.{ts,tsx,md,mdx}"],
    theme: {
        container: {
            center: true,
            padding: { DEFAULT: "1rem", sm: "2rem" },
            screens: { "2xl": "1400px" }
        },
        extend: {
            colors: { brandStart: "#8ecfff", brandEnd: "#5caeff" },
            backgroundImage: { magic: "linear-gradient(135deg, #8ecfff 0%, #5caeff 100%)" },
            boxShadow: { magic: "0 10px 30px 0 rgba(140,190,255,0.35)" }
        }
    },
    darkMode: "class",
    plugins: [typography]
};

export default config;
