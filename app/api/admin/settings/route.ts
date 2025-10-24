import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

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
    await prisma.appSettings.createMany({ data: [DEFAULTS as any], skipDuplicates: true });
    const row = await prisma.appSettings.findUnique({ where: { id: "global" } });
    if (!row) return await prisma.appSettings.create({ data: DEFAULTS as any });
    return row;
}

// Validate hex color format
function isValidHexColor(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

// Validate URL format
function isValidUrl(url: string): boolean {
    if (!url) return true; // empty is ok
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// List of valid IANA timezones (subset - expand as needed)
const VALID_TIMEZONES = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
    "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney",
    "UTC"
];

function isValidTimezone(tz: string): boolean {
    return VALID_TIMEZONES.includes(tz);
}

export async function GET() {
    try {
        const session = await requireAdmin();
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const row = await ensureSettings();
        return NextResponse.json(row);
    } catch (e) {
        console.error("GET /api/admin/settings failed:", e);
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await requireAdmin();
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data: any = {};

        // primitives with validation
        if (body.siteName !== undefined) {
            const siteName = String(body.siteName).trim();
            if (siteName.length === 0 || siteName.length > 100) {
                return NextResponse.json({ error: "Site name must be 1-100 characters" }, { status: 400 });
            }
            data.siteName = siteName;
        }
        
        if (body.timezone !== undefined) {
            const timezone = String(body.timezone);
            if (!isValidTimezone(timezone)) {
                return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
            }
            data.timezone = timezone;
        }

        // markdown text
        if (body.homepageIntro !== undefined) data.homepageIntro = body.homepageIntro ?? null;
        if (body.footerMarkdown !== undefined) data.footerMarkdown = body.footerMarkdown ?? null;
        if (body.aboutMarkdown !== undefined) data.aboutMarkdown = body.aboutMarkdown ?? null;
        if (body.applicationsIntroMarkdown !== undefined) {
            data.applicationsIntroMarkdown = body.applicationsIntroMarkdown ?? null;
        }

        // JSON groups with validation
        if (body.branding !== undefined) {
            const b = body.branding || {};
            const logoUrl = String(b.logoUrl ?? "");
            const bannerUrl = String(b.bannerUrl ?? "");
            const accentHex = String(b.accentHex ?? "#3b82f6");
            
            if (!isValidUrl(logoUrl)) {
                return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
            }
            if (!isValidUrl(bannerUrl)) {
                return NextResponse.json({ error: "Invalid banner URL" }, { status: 400 });
            }
            if (!isValidHexColor(accentHex)) {
                return NextResponse.json({ error: "Invalid hex color format (use #RRGGBB)" }, { status: 400 });
            }
            
            data.branding = { logoUrl, bannerUrl, accentHex };
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
            const imageUrl = String(s.image ?? "");
            
            if (!isValidUrl(imageUrl)) {
                return NextResponse.json({ error: "Invalid SEO image URL" }, { status: 400 });
            }
            
            data.seo = {
                title: String(s.title ?? ""),
                description: String(s.description ?? ""),
                image: imageUrl,
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

        const updated = await prisma.appSettings.update({ where: { id: "global" }, data });
        
        // Audit log for security
        console.log(`[AUDIT] Settings updated by admin user ${session?.user?.id || 'unknown'} at ${new Date().toISOString()}`);
        console.log(`[AUDIT] Updated fields: ${Object.keys(data).join(', ')}`);
        
        return NextResponse.json(updated);
    } catch (e) {
        console.error("PATCH /api/admin/settings failed:", e);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
