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

