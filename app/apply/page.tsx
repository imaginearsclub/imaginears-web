"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useForm, FormProvider, Controller, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Turnstile from "react-turnstile";
import { toast } from "sonner";
import { 
    Input, 
    Alert, 
    Checkbox, 
    Badge, 
    Separator, 
    Spinner, 
    Progress as ProgressBar,
    Breadcrumb
} from "@/components/common";
import { cn } from "@/lib/utils";
import { 
    Sparkles, 
    User, 
    Briefcase, 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft, 
    Shield 
} from "lucide-react";
import {
    StepSafeSchema,
    type StepSafeInput,
    Roles,
    DevSpecialties,
    Levels,
    schemaForRole,
    type FinalApplicationInput,
} from "@/lib/validation/application";

// Security: Freeze language list
const LANGS = Object.freeze(["Java", "JavaScript", "TypeScript", "Python", "Go", "C#", "Rust"]);

// Security: Rate limiting for form submissions
const RATE_LIMIT_MS = 5000; // 5 seconds between submissions
let lastSubmitTime = 0;

function getLocalTZ() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
        return "";
    }
}

const stepAnim = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.18 } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

export default function ApplyPage() {
    const methods = useForm<StepSafeInput>({
        resolver: zodResolver(StepSafeSchema), // step-safe: no union errors mid-flow
        defaultValues: {
            name: "",
            email: "",
            mcUsername: "",
            confirm16: false,
            canDiscord: true,
            discordUser: "",
            ageRange: "Under18" as const,
            timezone: getLocalTZ(),
            priorStaff: false,
            priorServers: "",
            visitedDisney: false,
            visitedDetails: "",
            role: "Developer" as const,
            // developer
            devPortfolioUrl: "",
            devSpecialty: "Web" as const,
            devLanguages: [],
            // imaginear
            imgPortfolioUrl: "",
            imgWorldEditLevel: "Beginner" as const,
            imgPluginFamiliar: "Beginner" as const,
            // guest relations
            grStory: "",
            grValue: "",
            grSuggestions: "",
        } as const as any,
        mode: "onBlur",
    });

    const {
        handleSubmit,
        watch,
        setValue,
        formState: { isSubmitting, errors },
    } = methods;

    const role = watch("role");
    const canDiscord = watch("canDiscord");
    const confirm16 = watch("confirm16");
    const priorStaff = watch("priorStaff");
    const visitedDisney = watch("visitedDisney");

    // Honeypot (bots often fill visible-ish inputs or hidden ones)
    const honeypotRef = useRef<HTMLInputElement | null>(null);

    // Cloudflare Turnstile
    const [tsToken, setTsToken] = useState<string>("");
    const siteKey = process.env['NEXT_PUBLIC_TURNSTILE_SITE_KEY'] || "";

    useEffect(() => {
        if (!canDiscord) setValue("discordUser", "");
    }, [canDiscord, setValue]);

    const [step, setStep] = useState(0);
    const maxStep = 3;

    // Performance: Memoize navigation functions
    const next = useCallback(() => {
        setStep((s) => Math.min(maxStep, s + 1));
    }, [maxStep]);
    
    const back = useCallback(() => {
        setStep((s) => Math.max(0, s - 1));
    }, []);

    async function onSubmit(data: StepSafeInput) {
        // Security: Rate limiting
        const now = Date.now();
        if (now - lastSubmitTime < RATE_LIMIT_MS) {
            toast.error("Please wait a moment before submitting again");
            return;
        }
        lastSubmitTime = now;
        // Honeypot check
        if (honeypotRef.current && honeypotRef.current.value.trim().length > 0) {
            // Quietly drop (security: don't reveal honeypot to bots)
            toast.error("Unable to submit at this time");
            return;
        }

        if (!confirm16) return; // UX guard; schema also enforces

        // Final strict validation by role (prevents TS2339 etc.)
        const strictSchema = schemaForRole(data.role);
        const finalData = strictSchema.parse(data) as FinalApplicationInput;

        // Require Turnstile token
        if (!tsToken) {
            toast.error("Please verify the security challenge below");
            return;
        }

        const submitPromise = (async () => {
            const res = await fetch("/api/public/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...finalData, __turnstileToken: tsToken, __hp: "" }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || "Something went wrong submitting your application");
            }

            return res.json();
        })();

        toast.promise(submitPromise, {
            loading: "Submitting your application...",
            success: "Application submitted! Redirecting...",
            error: (err) => err.message || "Failed to submit application",
        });

        try {
            await submitPromise;
            // Redirect on success
            setTimeout(() => {
                window.location.href = "/apply/success";
            }, 1000); // Brief delay to show success toast
        } catch (e) {
            console.error(e);
        }
    }

    const errorList = useMemo(
        () =>
            Object.values(errors).length > 0 ? (
                <Alert variant="error" className="mb-3">
                    Please check the highlighted fields.
                </Alert>
            ) : null,
        [errors]
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Breadcrumb Navigation */}
                <div className="mb-6 animate-in fade-in duration-300">
                    <Breadcrumb
                        items={[
                            { label: "Apply" },
                        ]}
                    />
                </div>

                {/* Header */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={cn(
                                "flex items-center justify-center w-16 h-16 rounded-2xl",
                                "bg-gradient-to-br from-blue-500 to-purple-500",
                                "shadow-lg shadow-blue-500/30"
                            )}>
                                <Sparkles className="w-8 h-8 text-white" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                                <h1 className={cn(
                                    "text-3xl md:text-4xl font-bold",
                                    "text-slate-900 dark:text-white mb-2"
                                )}>
                                    Join the Imaginears Team
                                </h1>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="primary" size="sm">
                                        Now Hiring
                                    </Badge>
                                    <Badge variant="success" size="sm">
                                        Rolling Applications
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Help us craft magical memories and dream up new adventures for guests around the world.
                        </p>
                        
                        {/* Privacy Disclaimer */}
                        <Alert variant="info" className="mt-6">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 dark:text-white mb-1">
                                        Your Privacy is Protected
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        All information you provide is kept strictly confidential and will only be used for 
                                        application review purposes. We never share your personal details with third parties 
                                        and store your data securely in compliance with privacy regulations.
                                    </p>
                                </div>
                            </div>
                        </Alert>
                    </div>
                </div>

                <div className={cn(
                    "rounded-2xl border-2 p-4 sm:p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100",
                    "border-slate-300 dark:border-slate-700",
                    "bg-white dark:bg-slate-900"
                )}>
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Honeypot (hidden from sighted users) */}
                        <input
                            ref={honeypotRef}
                            name="company"
                            autoComplete="organization"
                            tabIndex={-1}
                            aria-hidden="true"
                            className="hidden"
                        />

                        {errorList}

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Step {step + 1} of {maxStep + 1}
                                </span>
                                <Badge variant="default" size="sm">
                                    {Math.round(((step + 1) / (maxStep + 1)) * 100)}% Complete
                                </Badge>
                            </div>
                            <ProgressBar 
                                value={((step + 1) / (maxStep + 1)) * 100} 
                                className="h-2"
                            />
                        </div>

                        <Separator className="mb-6" />

                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <motion.div key="step0" {...stepAnim} className="space-y-4">
                                    <SectionTitle 
                                        title="About You" 
                                        subtitle="Tell us who you are."
                                        icon={<User className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                    />
                                    <FieldText name="name" label="Full Name *" placeholder="Your name" />
                                    <FieldEmail name="email" label="Email *" placeholder="name@example.com" />
                                    <FieldText name="mcUsername" label="Minecraft Username *" placeholder="Your in-game name" />
                                    <FieldSelect
                                        name="ageRange"
                                        label="Age Range *"
                                        options={[
                                            { value: "Under18", label: "Under 18" },
                                            { value: "18-24", label: "18–24" },
                                            { value: "25+", label: "25+" },
                                        ]}
                                    />
                                    <FieldCheckbox name="confirm16" label="I confirm that I am at least 16 years old." />
                                    {!confirm16 && (
                                        <Alert variant="warning">
                                            Applicants must be 16 or older.
                                        </Alert>
                                    )}
                                </motion.div>
                            )}

                            {step === 1 && (
                                <motion.div key="step1" {...stepAnim} className="space-y-4">
                                    <SectionTitle 
                                        title="Experience" 
                                        subtitle="A few quick questions."
                                        icon={<Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                    />
                                    <FieldTimezone />
                                    <FieldSwitch name="canDiscord" label="Can you use Discord?" />
                                    {canDiscord && <FieldText name="discordUser" label="Discord Username" placeholder="name#0001 or @name" />}
                                    <FieldSwitch name="priorStaff" label="Have you been staff on a Minecraft server before?" />
                                    {priorStaff && (
                                        <FieldText
                                            name="priorServers"
                                            label="Which servers or IPs?"
                                            placeholder="Example: play.example.net — Moderator (2023–2024)"
                                        />
                                    )}
                                    <FieldSwitch name="visitedDisney" label="Have you visited a Disney park or cruise?" />
                                    {visitedDisney && (
                                        <FieldText name="visitedDetails" label="Which ones?" placeholder="e.g., WDW Magic Kingdom (2022), DCL" />
                                    )}
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" {...stepAnim} className="space-y-4">
                                    <SectionTitle 
                                        title="Your Role" 
                                        subtitle="Pick the path that fits you best."
                                        icon={<Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                    />
                                    <FieldSelect
                                        name="role"
                                        label="Which position are you applying for? *"
                                        options={Roles.map((r) => ({ value: r, label: r === "GuestServices" ? "Guest Relations" : r }))}
                                    />

                                    {role === "Developer" && (
                                        <div className="space-y-4">
                                            <FieldUrl name="devPortfolioUrl" label="Portfolio or GitHub *" placeholder="https://github.com/you" />
                                            <FieldSelect
                                                name="devSpecialty"
                                                label="Primary specialty *"
                                                options={DevSpecialties.map((s) => ({ value: s, label: s === "FullStack" ? "Full Stack" : s }))}
                                            />
                                            <Controller
                                                name="devLanguages"
                                                render={({ field }) => (
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                                                            Languages *
                                                        </label>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {LANGS.map((lang) => {
                                                                const checked = field.value?.includes(lang);
                                                                return (
                                                                    <label key={lang} className="inline-flex items-center gap-2 text-sm">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!checked}
                                                                            onChange={() => {
                                                                                const set = new Set<string>(field.value || []);
                                                                                checked ? set.delete(lang) : set.add(lang);
                                                                                field.onChange(Array.from(set));
                                                                            }}
                                                                        />
                                                                        {lang}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                        <FieldError name="devLanguages" />
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    )}

                                    {role === "Imaginear" && (
                                        <div className="space-y-4">
                                            <FieldUrl name="imgPortfolioUrl" label="Portfolio or Showcase *" placeholder="https://yourportfolio.com" />
                                            <FieldSelect
                                                name="imgWorldEditLevel"
                                                label="WorldEdit knowledge *"
                                                options={Levels.map((l) => ({ value: l, label: l }))}
                                            />
                                            <FieldSelect
                                                name="imgPluginFamiliar"
                                                label="Familiarity with plugins *"
                                                options={Levels.map((l) => ({ value: l, label: l }))}
                                            />
                                        </div>
                                    )}

                                    {role === "GuestServices" && (
                                        <div className="space-y-4">
                                            <FieldTextarea
                                                name="grStory"
                                                label="Tell us about a time you went above and beyond to help someone *"
                                                rows={5}
                                            />
                                            <FieldTextarea
                                                name="grValue"
                                                label="What could you bring to Imaginears Club as a Guest Relations member? *"
                                                rows={4}
                                            />
                                            <FieldTextarea
                                                name="grSuggestions"
                                                label="Any suggestions to make the server better for guests?"
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" {...stepAnim} className="space-y-4">
                                    <SectionTitle 
                                        title="Review & Verify" 
                                        subtitle="One last step before you submit."
                                        icon={<Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                    />
                                    {/* Cloudflare Turnstile */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                        <Turnstile
                                            sitekey={siteKey}
                                            onVerify={(token) => setTsToken(token)}
                                            onExpire={() => setTsToken("")}
                                            onError={() => setTsToken("")}
                                            appearance="interaction-only"
                                            theme="auto"
                                        />
                                        {!tsToken && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                Please complete the verification above.
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Separator className="my-6" />

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={back}
                                disabled={step === 0 || isSubmitting}
                                className={cn(
                                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                                    "bg-slate-100 dark:bg-slate-800",
                                    "text-slate-900 dark:text-white",
                                    "hover:bg-slate-200 dark:hover:bg-slate-700",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "border-2 border-slate-300 dark:border-slate-700"
                                )}
                            >
                                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                                Back
                            </button>

                            {step < maxStep ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const ok = await validateStep(methods, step);
                                        if (ok) next();
                                    }}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 active:scale-95",
                                        "bg-gradient-to-r from-blue-600 to-blue-500",
                                        "text-white",
                                        "hover:from-blue-700 hover:to-blue-600",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "border-2 border-transparent",
                                        "shadow-lg hover:shadow-xl shadow-blue-500/30"
                                    )}
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !tsToken}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 active:scale-95",
                                        "bg-gradient-to-r from-blue-600 to-purple-600",
                                        "hover:from-blue-700 hover:to-purple-700",
                                        "text-white",
                                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                                        "border-2 border-transparent",
                                        "shadow-lg hover:shadow-xl shadow-blue-500/30"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Spinner size="sm" variant="current" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" aria-hidden="true" />
                                            Submit Application
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </FormProvider>
                </div>
            </div>
        </div>
    );
}

/* ---------- UI helpers ---------- */

function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
                {icon && (
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg",
                        "bg-blue-100 dark:bg-blue-900/30"
                    )}>
                        {icon}
                    </div>
                )}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {title}
                </h2>
            </div>
            {subtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function FieldError({ name }: { name: keyof StepSafeInput | string }) {
    const {
        formState: { errors },
    } = useFormContext<StepSafeInput>();
    const err = name.split(".").reduce<any>((a, k) => (a ? a[k] : undefined), errors as any);
    if (!err?.message) return null;
    return <p className="mt-1 text-xs text-rose-600">{String(err.message)}</p>;
}

function FieldText(props: { name: keyof StepSafeInput; label: string; placeholder?: string }) {
    const { register, formState: { errors } } = useFormContext<StepSafeInput>();
    const hasError = !!(errors as any)[props.name];
    return (
        <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                {props.label}
            </label>
            <Input
                {...register(props.name)}
                placeholder={props.placeholder}
                state={hasError ? "error" : "default"}
            />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldEmail(props: { name: keyof StepSafeInput; label: string; placeholder?: string }) {
    const { register, formState: { errors } } = useFormContext<StepSafeInput>();
    const hasError = !!(errors as any)[props.name];
    return (
        <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                {props.label}
            </label>
            <Input
                type="email"
                {...register(props.name)}
                placeholder={props.placeholder}
                state={hasError ? "error" : "default"}
            />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldUrl(props: { name: keyof StepSafeInput; label: string; placeholder?: string }) {
    const { register, formState: { errors } } = useFormContext<StepSafeInput>();
    const hasError = !!(errors as any)[props.name];
    return (
        <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                {props.label}
            </label>
            <Input
                type="url"
                {...register(props.name)}
                placeholder={props.placeholder}
                state={hasError ? "error" : "default"}
            />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldTextarea(props: { name: keyof StepSafeInput; label: string; rows?: number }) {
    const { register, formState: { errors } } = useFormContext<StepSafeInput>();
    const hasError = !!(errors as any)[props.name];
    return (
        <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                {props.label}
            </label>
            <textarea
                {...register(props.name)}
                rows={props.rows ?? 4}
                className={cn(
                    "w-full rounded-xl border-2 transition-all duration-150 px-3 py-2 text-sm",
                    "bg-white dark:bg-slate-900",
                    "text-slate-900 dark:text-white",
                    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    "focus:ring-offset-white dark:focus:ring-offset-slate-900",
                    hasError
                        ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/50"
                        : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/50"
                )}
            />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldSelect(props: {
    name: keyof StepSafeInput;
    label: string;
    options: { value: string; label: string }[];
}) {
    const { register, formState: { errors } } = useFormContext<StepSafeInput>();
    const hasError = !!(errors as any)[props.name];
    return (
        <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                {props.label}
            </label>
            <select
                {...register(props.name)}
                className={cn(
                    "w-full rounded-xl border-2 transition-all duration-150 px-3 py-2 text-sm h-10",
                    "bg-white dark:bg-slate-900",
                    "text-slate-900 dark:text-white",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    "focus:ring-offset-white dark:focus:ring-offset-slate-900",
                    hasError
                        ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/50"
                        : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/50"
                )}
            >
                {props.options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <FieldError name={props.name} />
        </div>
    );
}

function FieldCheckbox(props: { name: keyof StepSafeInput; label: string }) {
    const { control } = useFormContext<StepSafeInput>();
    return (
        <Controller
            name={props.name}
            control={control}
            render={({ field }) => (
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox 
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                        name={field.name}
                        onBlur={field.onBlur}
                    />
                    <span className="text-slate-900 dark:text-white">{props.label}</span>
                    <FieldError name={props.name} />
                </label>
            )}
        />
    );
}

function FieldSwitch(props: { name: keyof StepSafeInput; label: string }) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-900 dark:text-white">
                {props.label}
            </label>
            <input type="checkbox" className="h-5 w-5" {...register(props.name)} />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldTimezone() {
    const { register, formState: { errors } } = useFormContext<StepSafeInput>();
    const hasError = !!(errors as any)["timezone"];
    const options =
        (Intl as any).supportedValuesOf?.("timeZone")?.map((tz: string) => ({ value: tz, label: tz })) ??
        [{ value: "America/New_York", label: "America/New_York" }];
    return (
        <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Time Zone *
            </label>
            <select
                {...register("timezone")}
                className={cn(
                    "w-full rounded-xl border-2 transition-all duration-150 px-3 py-2 text-sm h-10",
                    "bg-white dark:bg-slate-900",
                    "text-slate-900 dark:text-white",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    "focus:ring-offset-white dark:focus:ring-offset-slate-900",
                    hasError
                        ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/50"
                        : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/50"
                )}
            >
                {options.map((o: any) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <FieldError name="timezone" />
        </div>
    );
}

/* Validate only fields for the current step */
async function validateStep(methods: any, step: number) {
    const { trigger, getValues } = methods as { trigger: (names?: string | string[]) => Promise<boolean>; getValues: () => StepSafeInput };

    if (step === 0) {
        return await trigger(["name", "email", "mcUsername", "confirm16", "ageRange"]);
    }
    if (step === 1) {
        return await trigger(["timezone", "canDiscord", "discordUser", "priorStaff", "priorServers", "visitedDisney", "visitedDetails"]);
    }
    if (step === 2) {
        const okRole = await trigger("role");
        if (!okRole) return false;
        const v = getValues();
        if (v.role === "Developer") {
            return await trigger(["devPortfolioUrl", "devSpecialty", "devLanguages"]);
        }
        if (v.role === "Imaginear") {
            return await trigger(["imgPortfolioUrl", "imgWorldEditLevel", "imgPluginFamiliar"]);
        }
        if (v.role === "GuestServices") {
            return await trigger(["grStory", "grValue", "grSuggestions"]);
        }
    }
    return true;
}
