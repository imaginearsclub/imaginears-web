"use client";

import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import MarkdownEditor from "@/components/common/MarkdownEditor";

type Branding = { logoUrl: string; bannerUrl: string; accentHex: string };
type EventsCfg = {
    defaultCategory: "Fireworks" | "Seasonal" | "MeetAndGreet" | "Parade" | "Other";
    recurrenceFreq: "NONE" | "DAILY" | "WEEKLY";
    byWeekday: ("SU"|"MO"|"TU"|"WE"|"TH"|"FR"|"SA")[];
    times: string[];
};
type ApplicationsCfg = { turnstileSiteKey: string; allowApplications: boolean };
type SocialCfg = { twitter?: string; instagram?: string; discord?: string; youtube?: string; facebook?: string; tiktok?: string };
type SeoCfg = { title?: string; description?: string; image?: string; twitterCard?: string };
type FeaturesCfg = { showEventsOnHome?: boolean; showApplicationsOnHome?: boolean };

type Settings = {
    siteName: string;
    timezone: string;
    homepageIntro?: string | null;
    footerMarkdown?: string | null;
    aboutMarkdown?: string | null;
    applicationsIntroMarkdown?: string | null;
    branding?: Branding | null;
    events?: EventsCfg | null;
    applications?: ApplicationsCfg | null;
    social?: SocialCfg | null;
    seo?: SeoCfg | null;
    features?: FeaturesCfg | null;
    updatedAt?: string;
};

const WEEKDAYS = ["SU","MO","TU","WE","TH","FR","SA"] as const;

export default function SettingsPage() {
    const [tab, setTab] = useState<"general"|"branding"|"content"|"events"|"applications"|"socialseo"|"security">("general");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [settings, setSettings] = useState<Settings>({
        siteName: "Imaginears",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
        homepageIntro: "",
        footerMarkdown: "",
        aboutMarkdown: "",
        applicationsIntroMarkdown: "",
        branding: { logoUrl: "", bannerUrl: "", accentHex: "#3b82f6" },
        events: { defaultCategory: "Other", recurrenceFreq: "NONE", byWeekday: [], times: [] },
        applications: { turnstileSiteKey: "", allowApplications: true },
        social: { twitter: "", instagram: "", discord: "", youtube: "", facebook: "", tiktok: "" },
        seo: { title: "", description: "", image: "", twitterCard: "summary_large_image" },
        features: { showEventsOnHome: true, showApplicationsOnHome: true },
    });

    async function load() {
        setLoading(true);
        setErr(null);
        try {
            const res = await fetch("/api/admin/settings", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setSettings({
                siteName: data.siteName,
                timezone: data.timezone,
                homepageIntro: data.homepageIntro ?? "",
                footerMarkdown: data.footerMarkdown ?? "",
                aboutMarkdown: data.aboutMarkdown ?? "",
                applicationsIntroMarkdown: data.applicationsIntroMarkdown ?? "",
                branding: data.branding ?? { logoUrl: "", bannerUrl: "", accentHex: "#3b82f6" },
                events: data.events ?? { defaultCategory: "Other", recurrenceFreq: "NONE", byWeekday: [], times: [] },
                applications: data.applications ?? { turnstileSiteKey: "", allowApplications: true },
                social: data.social ?? { twitter: "", instagram: "", discord: "", youtube: "", facebook: "", tiktok: "" },
                seo: data.seo ?? { title: "", description: "", image: "", twitterCard: "summary_large_image" },
                features: data.features ?? { showEventsOnHome: true, showApplicationsOnHome: true },
                updatedAt: data.updatedAt,
            });
        } catch (e: any) {
            setErr("Failed to load settings.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function save(partial: Partial<Settings>) {
        setSaving(true);
        setErr(null);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(partial),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await load();
        } catch (e: any) {
            setErr("Failed to save settings.");
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Settings</h1>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    {settings.updatedAt ? `Last updated: ${new Date(settings.updatedAt).toLocaleString()}` : ""}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                <TabBtn id="general" tab={tab} setTab={setTab}>General</TabBtn>
                <TabBtn id="branding" tab={tab} setTab={setTab}>Branding</TabBtn>
                <TabBtn id="content" tab={tab} setTab={setTab}>Content</TabBtn>
                <TabBtn id="events" tab={tab} setTab={setTab}>Events Defaults</TabBtn>
                <TabBtn id="applications" tab={tab} setTab={setTab}>Applications</TabBtn>
                <TabBtn id="socialseo" tab={tab} setTab={setTab}>Social & SEO</TabBtn>
                <TabBtn id="security" tab={tab} setTab={setTab}>Security</TabBtn>
            </div>

            {err && <div className="rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{err}</div>}

            {loading ? <div>Loading…</div> : (
                <>
                    {/* GENERAL */}
                    {tab === "general" && (
                        <Card>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Site name">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.siteName}
                                           onChange={(e)=>setSettings({...settings, siteName: e.target.value})}/>
                                </Field>
                                <Field label="Timezone">
                                    <select className="w-full rounded-2xl border px-4 py-3"
                                            value={settings.timezone}
                                            onChange={(e)=>setSettings({...settings, timezone: e.target.value})}>
                                        {(Intl as any).supportedValuesOf?.("timeZone")?.map((tz: string)=>(
                                            <option key={tz}>{tz}</option>
                                        )) || <option>America/New_York</option>}
                                    </select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Show on homepage: Events">
                                    <select className="w-full rounded-2xl border px-4 py-3"
                                            value={String(settings.features?.showEventsOnHome ?? true)}
                                            onChange={(e)=>setSettings({...settings, features: {...(settings.features||{}), showEventsOnHome: e.target.value === "true"}})}>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </Field>
                                <Field label="Show on homepage: Applications">
                                    <select className="w-full rounded-2xl border px-4 py-3"
                                            value={String(settings.features?.showApplicationsOnHome ?? true)}
                                            onChange={(e)=>setSettings({...settings, features: {...(settings.features||{}), showApplicationsOnHome: e.target.value === "true"}})}>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </Field>
                            </div>

                            <div className="flex justify-end">
                                <button className={`btn btn-primary ${saving?"is-loading":""}`}
                                        onClick={()=>save({
                                            siteName: settings.siteName,
                                            timezone: settings.timezone,
                                            features: settings.features
                                        })}
                                        disabled={saving}>Save</button>
                            </div>
                        </Card>
                    )}

                    {/* BRANDING */}
                    {tab === "branding" && (
                        <Card>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Logo URL">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.branding?.logoUrl ?? ""}
                                           onChange={(e)=>setSettings({...settings, branding: {...(settings.branding||{}), logoUrl: e.target.value}})}/>
                                </Field>
                                <Field label="Banner URL">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.branding?.bannerUrl ?? ""}
                                           onChange={(e)=>setSettings({...settings, branding: {...(settings.branding||{}), bannerUrl: e.target.value}})}/>
                                </Field>
                                <Field label="Accent color (hex)">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.branding?.accentHex ?? "#3b82f6"}
                                           onChange={(e)=>setSettings({...settings, branding: {...(settings.branding||{}), accentHex: e.target.value}})}/>
                                </Field>
                            </div>
                            <div className="flex justify-end">
                                <button className={`btn btn-primary ${saving?"is-loading":""}`}
                                        onClick={()=>save({ branding: settings.branding })}
                                        disabled={saving}>Save</button>
                            </div>
                        </Card>
                    )}

                    {/* CONTENT (Markdown) */}
                    {tab === "content" && (
                        <Card>
                            <MarkdownEditor
                                label="Homepage intro (Markdown)"
                                value={settings.homepageIntro ?? ""}
                                onChange={(v)=>setSettings({...settings, homepageIntro: v})}
                                rows={10}
                            />
                            <MarkdownEditor
                                label="Footer (Markdown)"
                                value={settings.footerMarkdown ?? ""}
                                onChange={(v)=>setSettings({...settings, footerMarkdown: v})}
                                rows={8}
                            />
                            <MarkdownEditor
                                label="About page (Markdown)"
                                value={settings.aboutMarkdown ?? ""}
                                onChange={(v)=>setSettings({...settings, aboutMarkdown: v})}
                                rows={12}
                            />
                            <MarkdownEditor
                                label="Applications intro (Markdown)"
                                value={settings.applicationsIntroMarkdown ?? ""}
                                onChange={(v)=>setSettings({...settings, applicationsIntroMarkdown: v})}
                                rows={8}
                            />
                            <div className="flex justify-end">
                                <button className={`btn btn-primary ${saving?"is-loading":""}`}
                                        onClick={()=>save({
                                            homepageIntro: settings.homepageIntro ?? "",
                                            footerMarkdown: settings.footerMarkdown ?? "",
                                            aboutMarkdown: settings.aboutMarkdown ?? "",
                                            applicationsIntroMarkdown: settings.applicationsIntroMarkdown ?? "",
                                        })}
                                        disabled={saving}>Save</button>
                            </div>
                        </Card>
                    )}

                    {/* EVENTS DEFAULTS */}
                    {tab === "events" && (
                        <Card>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Default category">
                                    <select className="w-full rounded-2xl border px-4 py-3"
                                            value={settings.events?.defaultCategory ?? "Other"}
                                            onChange={(e)=>setSettings({...settings, events: {...(settings.events||{}), defaultCategory: e.target.value as EventsCfg["defaultCategory"]}})}>
                                        <option value="Fireworks">Fireworks</option>
                                        <option value="Seasonal">Seasonal</option>
                                        <option value="MeetAndGreet">Meet & Greet</option>
                                        <option value="Parade">Parade</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </Field>
                                <Field label="Default recurrence">
                                    <select className="w-full rounded-2xl border px-4 py-3"
                                            value={settings.events?.recurrenceFreq ?? "NONE"}
                                            onChange={(e)=>setSettings({...settings, events: {...(settings.events||{}), recurrenceFreq: e.target.value as EventsCfg["recurrenceFreq"]}})}>
                                        <option value="NONE">One-time</option>
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                    </select>
                                </Field>
                            </div>

                            {settings.events?.recurrenceFreq === "WEEKLY" && (
                                <div className="mt-2">
                                    <label className="text-sm font-medium">Default weekly days</label>
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        {WEEKDAYS.map((d)=> {
                                            const set = new Set(settings.events?.byWeekday || []);
                                            const active = set.has(d);
                                            return (
                                                <button key={d} type="button"
                                                        onClick={()=>{
                                                            const cur = new Set(settings.events?.byWeekday || []);
                                                            cur.has(d) ? cur.delete(d) : cur.add(d);
                                                            setSettings({...settings, events: {...(settings.events||{}), byWeekday: Array.from(cur) as any }});
                                                        }}
                                                        className={`rounded-xl border px-3 py-1.5 text-sm ${active?"border-sky-500 bg-sky-50 dark:bg-sky-900/30":"border-slate-300 dark:border-slate-700"}`}>
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mt-3">
                                <label className="text-sm font-medium">Default showtimes</label>
                                <TimesEditor
                                    times={settings.events?.times || []}
                                    onChange={(times)=>setSettings({...settings, events: {...(settings.events||{}), times}})}
                                />
                            </div>

                            <div className="flex justify-end mt-3">
                                <button className={`btn btn-primary ${saving?"is-loading":""}`}
                                        onClick={()=>save({ events: settings.events })}
                                        disabled={saving}>Save</button>
                            </div>
                        </Card>
                    )}

                    {/* APPLICATIONS */}
                    {tab === "applications" && (
                        <Card>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Cloudflare Turnstile Site Key (public)">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.applications?.turnstileSiteKey ?? ""}
                                           onChange={(e)=>setSettings({...settings, applications: {...(settings.applications||{}), turnstileSiteKey: e.target.value}})}/>
                                </Field>
                                <Field label="Allow applications">
                                    <select className="w-full rounded-2xl border px-4 py-3"
                                            value={String(settings.applications?.allowApplications ?? true)}
                                            onChange={(e)=>setSettings({...settings, applications: {...(settings.applications||{}), allowApplications: e.target.value === "true"}})}>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </Field>
                            </div>
                            <div className="flex justify-end">
                                <button className={`btn btn-primary ${saving?"is-loading":""}`}
                                        onClick={()=>save({ applications: settings.applications })}
                                        disabled={saving}>Save</button>
                            </div>
                        </Card>
                    )}

                    {/* SOCIAL & SEO */}
                    {tab === "socialseo" && (
                        <Card>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {["twitter","instagram","discord","youtube","facebook","tiktok"].map((k)=>(
                                    <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} URL`}>
                                        <input className="w-full rounded-2xl border px-4 py-3"
                                               value={(settings.social as any)?.[k] ?? ""}
                                               onChange={(e)=>setSettings({...settings, social: {...(settings.social||{}), [k]: e.target.value}})}
                                        />
                                    </Field>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                <Field label="SEO title (fallback)">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.seo?.title ?? ""}
                                           onChange={(e)=>setSettings({...settings, seo: {...(settings.seo||{}), title: e.target.value}})} />
                                </Field>
                                <Field label="SEO description">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.seo?.description ?? ""}
                                           onChange={(e)=>setSettings({...settings, seo: {...(settings.seo||{}), description: e.target.value}})} />
                                </Field>
                                <Field label="SEO image URL">
                                    <input className="w-full rounded-2xl border px-4 py-3"
                                           value={settings.seo?.image ?? ""}
                                           onChange={(e)=>setSettings({...settings, seo: {...(settings.seo||{}), image: e.target.value}})} />
                                </Field>
                                <Field label="Twitter card">
                                    <select className="w-full rounded-2xl border px-4 py-3"
                                            value={settings.seo?.twitterCard ?? "summary_large_image"}
                                            onChange={(e)=>setSettings({...settings, seo: {...(settings.seo||{}), twitterCard: e.target.value}})}>
                                        <option value="summary_large_image">summary_large_image</option>
                                        <option value="summary">summary</option>
                                    </select>
                                </Field>
                            </div>

                            <div className="flex justify-end mt-3">
                                <button className={`btn btn-primary ${saving?"is-loading":""}`}
                                        onClick={()=>save({ social: settings.social, seo: settings.seo })}
                                        disabled={saving}>Save</button>
                            </div>
                        </Card>
                    )}

                    {/* SECURITY */}
                    {tab === "security" && (
                        <Card>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Generate a bcrypt hash for <code>ADMIN_PASSWORD_HASH</code>:
                            </p>
                            <HashTool />
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

/* --- tiny UI helpers --- */
function TabBtn({ id, tab, setTab, children }:{ id:any; tab:any; setTab:(v:any)=>void; children:React.ReactNode }) {
    const active = tab === id;
    return (
        <button
            className={`px-3 py-1.5 rounded-full text-sm border ${active?"bg-slate-900 text-white dark:bg-white dark:text-slate-900":"bg-white dark:bg-slate-900"} border-slate-200 dark:border-slate-800`}
            onClick={()=>setTab(id)}
        >
            {children}
        </button>
    );
}
function Card({ children }:{children:React.ReactNode}) {
    return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 space-y-3">{children}</div>;
}
function Field({ label, children }:{label:string; children:React.ReactNode}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}
function TimesEditor({ times, onChange }:{ times: string[]; onChange:(t:string[])=>void }) {
    function add(t="00:00") {
        const s = new Set(times);
        s.add(t);
        onChange(Array.from(s).sort());
    }
    function update(i:number, t:string) {
        const next = [...times];
        next[i] = t;
        onChange(next.sort());
    }
    function remove(i:number) {
        const next = times.filter((_,idx)=>idx!==i);
        onChange(next);
    }
    return (
        <div className="space-y-2">
            {(times.length?times:["15:00"]).map((t, i)=>(
                <div key={i} className="flex items-center gap-2">
                    <input type="time" value={t} onChange={(e)=>update(i, e.target.value)}
                           className="w-40 rounded-2xl border px-3 py-2" step={60}/>
                    <button type="button" className="btn btn-muted btn-xs" onClick={()=>remove(i)}>Remove</button>
                </div>
            ))}
            <div className="flex gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>add("00:00")}>+ Add time</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>onChange(["15:00","18:00","21:00"])}>Set 3p/6p/9p</button>
            </div>
        </div>
    );
}
function HashTool() {
    const [plain, setPlain] = useState("");
    const [hash, setHash] = useState("");
    const [rounds, setRounds] = useState(12);
    async function gen() {
        const h = await bcrypt.hash(plain, rounds);
        setHash(h);
    }
    return (
        <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium">New admin password (plain)</label>
                    <input type="password" className="w-full rounded-2xl border px-4 py-3" value={plain} onChange={(e)=>setPlain(e.target.value)}/>
                </div>
                <div>
                    <label className="text-sm font-medium">bcrypt rounds</label>
                    <input type="number" min={8} max={14} className="w-full rounded-2xl border px-4 py-3" value={rounds} onChange={(e)=>setRounds(Number(e.target.value)||12)}/>
                </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={gen} disabled={!plain}>Generate hash</button>
            {hash && (
                <div className="mt-2">
                    <label className="text-sm font-medium">Paste into <code>ADMIN_PASSWORD_HASH</code>:</label>
                    <pre className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-auto text-xs">{hash}</pre>
                </div>
            )}
        </div>
    );
}
