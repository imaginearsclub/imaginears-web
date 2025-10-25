import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { SessionPoliciesClient } from "./components/SessionPoliciesClient";

export const dynamic = "force-dynamic";

export default async function SessionPoliciesPage() {
  // Require session policy configuration permission
  const session = await requirePermission("sessions:configure_policies");
  if (!session) {
    redirect("/login");
  }

  // Fetch current policies (in production, these would come from a policies table)
  // For now, we'll use default values that can be configured
  const defaultPolicies = {
    maxConcurrentSessions: 5,
    sessionIdleTimeout: 30, // minutes
    rememberMeDuration: 30, // days
    requireStepUpFor: ['delete_account', 'change_password'],
    ipRestrictions: {
      enabled: false,
      whitelist: [] as string[],
      blacklist: [] as string[],
    },
    geoFencing: {
      enabled: false,
      allowedCountries: [] as string[],
      blockedCountries: [] as string[],
    },
    timeBasedAccess: {
      enabled: false,
      allowedHours: { start: 0, end: 24 },
      timezone: 'UTC',
    },
    deviceRestrictions: {
      enabled: false,
      allowedTypes: ['desktop', 'mobile', 'tablet'],
      requireTrustedDevice: false,
    },
    securityFeatures: {
      autoBlockSuspicious: true,
      requireReauthAfterSuspicious: true,
      enableVpnDetection: true,
      enableImpossibleTravelDetection: true,
      maxFailedLogins: 5,
      failedLoginWindow: 15, // minutes
    },
    notifications: {
      emailOnNewDevice: true,
      emailOnSuspicious: true,
      emailOnPolicyViolation: true,
      notifyAdminsOnCritical: true,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Session Policies
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Configure system-wide session security and access policies
            </p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <SessionPoliciesClient initialPolicies={defaultPolicies} />
    </div>
  );
}

