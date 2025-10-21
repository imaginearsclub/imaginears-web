/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import {
    StepSafeSchema,
    schemaForRole,
    type FinalApplicationInput,
} from "@/lib/validation/application";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs"; // ensure Prisma runs on Node runtime

/** ---------- Prisma (singleton) ---------- */
let _prisma: PrismaClient | null = null;
function prisma() {
    if (!_prisma) {
        // @ts-expect-error attach to global in dev
        _prisma = globalThis.__PRISMA__ ?? new PrismaClient();
        // @ts-expect-error singleton cache for dev HMR
        if (!globalThis.__PRISMA__) globalThis.__PRISMA__ = _prisma;
    }
    return _prisma!;
}

/** ---------- Simple in-memory rate limiter (3 req / hour / IP) ---------- */
/** NOTE: This resets on server restarts and doesn’t share across instances.
 * For production, prefer Upstash Ratelimit (Redis) or CF Worker in front.
 */
type Hit = number; // timestamp (ms)
const RATE_MAX = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateMap: Map<string, Hit[]> = new Map();

function rateLimitOk(ip: string): boolean {
    const now = Date.now();
    const arr = rateMap.get(ip) ?? [];
    const recent = arr.filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_MAX) return false;
    recent.push(now);
    rateMap.set(ip, recent);
    return true;
}

/** Extract client IP (works locally; behind proxy prefer x-forwarded-for) */
function getClientIp(req: Request): string {
    const xf = req.headers.get("x-forwarded-for");
    if (xf) return xf.split(",")[0].trim();
    const cfip = req.headers.get("cf-connecting-ip");
    if (cfip) return cfip;
    // last resort (not reliable in serverless)
    return (req as any).ip || "0.0.0.0";
}

/** ---------- Cloudflare Turnstile verify ---------- */
async function verifyTurnstile(token: string | undefined, remoteip: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        console.warn("TURNSTILE_SECRET_KEY not set; rejecting for safety.");
        return { ok: false, code: "missing_secret" as const };
    }
    if (!token) return { ok: false, code: "missing_token" as const };

    try {
        const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret, response: token, remoteip }),
            // NOTE: No-cache is fine; CF handles it
        });
        const data = (await resp.json()) as {
            success: boolean;
            "error-codes"?: string[];
            challenge_ts?: string;
            hostname?: string;
            action?: string;
            cdata?: string;
        };

        if (data.success) return { ok: true as const };
        return { ok: false as const, code: (data["error-codes"]?.[0] ?? "verify_failed") as any };
    } catch (e) {
        console.error("Turnstile verify error:", e);
        return { ok: false as const, code: "network_error" as const };
    }
}

/** ---------- Route: POST /api/public/applications ---------- */
export async function POST(req: Request) {
    const ip = getClientIp(req);

    try {
        const json = await req.json();

        // Honeypot: must be empty (we send __hp: "" from client)
        if (typeof json.__hp === "string" && json.__hp.trim().length > 0) {
            return NextResponse.json({ error: "Unable to submit at this time." }, { status: 400 });
        }

        // Rate limit
        if (!rateLimitOk(ip)) {
            return NextResponse.json(
                { error: "Too many submissions. Please try again later." },
                { status: 429 }
            );
        }

        // Turnstile
        const verify = await verifyTurnstile(json.__turnstileToken, ip);
        if (!verify.ok) {
            return NextResponse.json(
                { error: "Turnstile verification failed.", code: verify.code },
                { status: 400 }
            );
        }

        // Step-safe validation (shape + basic rules)
        const stepSafe = StepSafeSchema.parse(json);

        if (!stepSafe.confirm16) {
            return NextResponse.json(
                { error: "Applicants must be at least 16." },
                { status: 400 }
            );
        }

        // Strict role-specific validation
        const strictSchema = schemaForRole(stepSafe.role);
        const data = strictSchema.parse(stepSafe) as FinalApplicationInput;

        const created = await prisma().application.create({
            data: {
                name: data.name,
                email: data.email,
                mcUsername: data.mcUsername,
                role: data.role,
                timezone: data.timezone,
                ageRange: data.ageRange,
                canDiscord: data.canDiscord,
                discordUser: data.canDiscord ? data.discordUser || null : null,
                priorStaff: data.priorStaff,
                priorServers: data.priorStaff ? data.priorServers || null : null,
                visitedDisney: data.visitedDisney,
                visitedDetails: data.visitedDisney ? data.visitedDetails || null : null,

                // Developer
                devPortfolioUrl: data.role === "Developer" ? data.devPortfolioUrl : null,
                devSpecialty: data.role === "Developer" ? data.devSpecialty : null,
                devLanguages: data.role === "Developer" ? (data.devLanguages?.join(",") || null) : null,

                // Imaginear
                imgPortfolioUrl: data.role === "Imaginear" ? data.imgPortfolioUrl : null,
                imgWorldEditLevel: data.role === "Imaginear" ? data.imgWorldEditLevel : null,
                imgPluginFamiliar: data.role === "Imaginear" ? data.imgPluginFamiliar : null,

                // Guest Relations
                grStory: data.role === "GuestServices" ? data.grStory : null,
                grValue: data.role === "GuestServices" ? data.grValue : null,
                grSuggestions: data.role === "GuestServices" ? (data.grSuggestions || null) : null,
            },
            select: { id: true, role: true, name: true, email: true },
        });

        // Optional: Discord webhook notify
        try {
            const hook = process.env.DISCORD_WEBHOOK_URL;
            if (hook) {
                const roleEmoji =
                    created.role === "Developer" ? "🧩" : created.role === "Imaginear" ? "🎨" : "💫";
                await fetch(hook, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: `${roleEmoji} New application: **${created.name}** (${created.role}) — ${created.email}`,
                    }),
                });
            }
        } catch {
            // ignore webhook errors
        }

        return NextResponse.json({ id: created.id });
    } catch (err: any) {
        // Zod errors
        if (err?.issues) {
            return NextResponse.json(
                { error: "Invalid submission.", details: err.issues },
                { status: 400 }
            );
        }
        console.error("APP POST error:", err);
        return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
}
