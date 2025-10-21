import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _prisma: PrismaClient | null = null;
function prisma() {
    if (!_prisma) {
        // @ts-expect-error dev singleton
        _prisma = globalThis.__PRISMA__ ?? new PrismaClient();
        // @ts-expect-error dev singleton
        if (!globalThis.__PRISMA__) globalThis.__PRISMA__ = _prisma;
    }
    return _prisma!;
}

const DEFAULTS = {
    id: "global",
    siteName: "Imaginears",
    timezone: "America/New_York",
    homepageIntro: "",
    footerMarkdown: "",
    aboutMarkdown: "",
    applicationsIntroMarkdown: "",
    branding: { logoUrl: "", bannerUrl: "", accentHex: "#3b82f6" },
    events: {
        defaultCategory: "Other",
        recurrenceFreq: "NONE",
        byWeekday: [] as string[],
        times: [] as string[],
    },
    applications: { turnstileSiteKey: "", allowApplications: true },
    social: { twitter: "", instagram: "", discord: "", youtube: "", facebook: "", tiktok: "" },
    seo: { title: "", description: "", image: "", twitterCard: "summary_large_image" },
    features: { showEventsOnHome: true, showApplicationsOnHome: true },
};

// Race-safe ensure row
async function ensureSettings() {
    await prisma().appSettings.createMany({ data: [DEFAULTS as any], skipDuplicates: true });
    const row = await prisma().appSettings.findUnique({ where: { id: "global" } });
    if (!row) return await prisma().appSettings.create({ data: DEFAULTS as any });
    return row;
}

export async function GET() {
    try {
        const row = await ensureSettings();
        return NextResponse.json(row);
    } catch (e) {
        console.error("GET /api/admin/settings failed:", e);
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const data: any = {};

        // primitives
        if (body.siteName !== undefined) data.siteName = String(body.siteName);
        if (body.timezone !== undefined) data.timezone = String(body.timezone);

        // markdown text
        if (body.homepageIntro !== undefined) data.homepageIntro = body.homepageIntro ?? null;
        if (body.footerMarkdown !== undefined) data.footerMarkdown = body.footerMarkdown ?? null;
        if (body.aboutMarkdown !== undefined) data.aboutMarkdown = body.aboutMarkdown ?? null;
        if (body.applicationsIntroMarkdown !== undefined) {
            data.applicationsIntroMarkdown = body.applicationsIntroMarkdown ?? null;
        }

        // JSON groups
        if (body.branding !== undefined) {
            const b = body.branding || {};
            data.branding = {
                logoUrl: String(b.logoUrl ?? ""),
                bannerUrl: String(b.bannerUrl ?? ""),
                accentHex: String(b.accentHex ?? "#3b82f6"),
            };
        }

        if (body.events !== undefined) {
            const ev = body.events || {};
            data.events = {
                defaultCategory: ev.defaultCategory || "Other",
                recurrenceFreq: ev.recurrenceFreq || "NONE",
                byWeekday: Array.isArray(ev.byWeekday) ? ev.byWeekday : [],
                times: Array.isArray(ev.times) ? ev.times : [],
            };
        }

        if (body.applications !== undefined) {
            const a = body.applications || {};
            data.applications = {
                turnstileSiteKey: String(a.turnstileSiteKey ?? ""),
                allowApplications: typeof a.allowApplications === "boolean" ? a.allowApplications : true,
            };
        }

        if (body.social !== undefined) {
            const s = body.social || {};
            data.social = {
                twitter: String(s.twitter ?? ""),
                instagram: String(s.instagram ?? ""),
                discord: String(s.discord ?? ""),
                youtube: String(s.youtube ?? ""),
                facebook: String(s.facebook ?? ""),
                tiktok: String(s.tiktok ?? ""),
            };
        }

        if (body.seo !== undefined) {
            const s = body.seo || {};
            data.seo = {
                title: String(s.title ?? ""),
                description: String(s.description ?? ""),
                image: String(s.image ?? ""),
                twitterCard: String(s.twitterCard ?? "summary_large_image"),
            };
        }

        if (body.features !== undefined) {
            const f = body.features || {};
            data.features = {
                showEventsOnHome: !!f.showEventsOnHome,
                showApplicationsOnHome: !!f.showApplicationsOnHome,
            };
        }

        const updated = await prisma().appSettings.update({ where: { id: "global" }, data });
        return NextResponse.json(updated);
    } catch (e) {
        console.error("PATCH /api/admin/settings failed:", e);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
