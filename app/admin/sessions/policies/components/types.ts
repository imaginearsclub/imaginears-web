export interface SessionPolicies {
  maxConcurrentSessions: number;
  sessionIdleTimeout: number;
  rememberMeDuration: number;
  requireStepUpFor: string[];
  ipRestrictions: {
    enabled: boolean;
    whitelist: string[];
    blacklist: string[];
  };
  geoFencing: {
    enabled: boolean;
    allowedCountries: string[];
    blockedCountries: string[];
  };
  timeBasedAccess: {
    enabled: boolean;
    allowedHours: { start: number; end: number };
    timezone: string;
  };
  deviceRestrictions: {
    enabled: boolean;
    allowedTypes: string[];
    requireTrustedDevice: boolean;
  };
  securityFeatures: {
    autoBlockSuspicious: boolean;
    requireReauthAfterSuspicious: boolean;
    enableVpnDetection: boolean;
    enableImpossibleTravelDetection: boolean;
    maxFailedLogins: number;
    failedLoginWindow: number;
  };
  notifications: {
    emailOnNewDevice: boolean;
    emailOnSuspicious: boolean;
    emailOnPolicyViolation: boolean;
    notifyAdminsOnCritical: boolean;
  };
}

export type SetPolicies = React.Dispatch<React.SetStateAction<SessionPolicies>>;

