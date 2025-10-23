import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
    content: [
        "./app/**/*.{ts,tsx,md,mdx}",
        "./components/**/*.{ts,tsx,md,mdx}",
        "./lib/**/*.{ts,tsx}",
        "./middleware.ts",
        "./next.config.ts"
    ],
    blocklist: [
        // Prevent potentially dangerous or large classes
        "!important",
        "animate-ping",
        "animate-spin"
    ],
    theme: {
        container: {
            center: true,
            padding: { DEFAULT: "1rem", sm: "2rem" },
            screens: { "2xl": "1400px" }
        },
        extend: {
            colors: { 
                brandStart: "#8ecfff", 
                brandEnd: "#5caeff",
                // Semantic color names for better maintainability
                primary: "#8ecfff",
                secondary: "#5caeff",
                accent: "#5caeff"
            },
            backgroundImage: { 
                magic: "linear-gradient(135deg, #8ecfff 0%, #5caeff 100%)" 
            },
            boxShadow: { 
                magic: "0 10px 30px 0 rgba(140,190,255,0.35)" 
            },
            // Performance optimizations
            animation: {
                "fade-in": "fadeIn 0.5s ease-in-out",
                "slide-up": "slideUp 0.3s ease-out"
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" }
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" }
                }
            }
        }
    },
    darkMode: "class",
    plugins: [typography]
};

export default config;
