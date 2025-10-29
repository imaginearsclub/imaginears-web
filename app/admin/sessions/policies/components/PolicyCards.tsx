import { Card, CardContent, CardHeader, CardTitle, Input, Switch } from '@/components/common';
import { Lock, Bell } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';
import { useCallback, memo } from 'react';

// eslint-disable-next-line max-lines-per-function
export const SecurityFeaturesCard = memo(({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) => {
  // Memoize all handlers to prevent unnecessary re-renders
  const handleAutoBlockChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      securityFeatures: { ...prev.securityFeatures, autoBlockSuspicious: checked }
    }));
  }, [setPolicies]);

  const handleReauthChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      securityFeatures: { ...prev.securityFeatures, requireReauthAfterSuspicious: checked }
    }));
  }, [setPolicies]);

  const handleVpnDetectionChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      securityFeatures: { ...prev.securityFeatures, enableVpnDetection: checked }
    }));
  }, [setPolicies]);

  const handleImpossibleTravelChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      securityFeatures: { ...prev.securityFeatures, enableImpossibleTravelDetection: checked }
    }));
  }, [setPolicies]);

  const handleMaxFailedLoginsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPolicies((prev) => ({
      ...prev,
      securityFeatures: { ...prev.securityFeatures, maxFailedLogins: Math.max(1, parseInt(e.target.value) || 5) }
    }));
  }, [setPolicies]);

  const handleFailedLoginWindowChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPolicies((prev) => ({
      ...prev,
      securityFeatures: { ...prev.securityFeatures, failedLoginWindow: Math.max(1, parseInt(e.target.value) || 15) }
    }));
  }, [setPolicies]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          <CardTitle className="text-base">Security Features</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Auto-Block Suspicious Sessions</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Automatically terminate sessions flagged as suspicious
            </p>
          </div>
          <Switch
            checked={policies.securityFeatures.autoBlockSuspicious}
            onCheckedChange={handleAutoBlockChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Require Re-auth After Suspicious Activity</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Force users to log in again after suspicious activity is detected
            </p>
          </div>
          <Switch
            checked={policies.securityFeatures.requireReauthAfterSuspicious}
            onCheckedChange={handleReauthChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">VPN Detection</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Detect and flag commercial VPN usage</p>
          </div>
          <Switch
            checked={policies.securityFeatures.enableVpnDetection}
            onCheckedChange={handleVpnDetectionChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Impossible Travel Detection</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Detect logins from geographically impossible locations
            </p>
          </div>
          <Switch
            checked={policies.securityFeatures.enableImpossibleTravelDetection}
            onCheckedChange={handleImpossibleTravelChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Max Failed Login Attempts</label>
            <Input
              type="number"
              value={policies.securityFeatures.maxFailedLogins}
              onChange={handleMaxFailedLoginsChange}
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Time Window (minutes)</label>
            <Input
              type="number"
              value={policies.securityFeatures.failedLoginWindow}
              onChange={handleFailedLoginWindowChange}
              min="1"
              max="1440"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SecurityFeaturesCard.displayName = 'SecurityFeaturesCard';

export const NotificationsCard = memo(({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) => {
  // Memoize all handlers to prevent unnecessary re-renders
  const handleEmailOnNewDeviceChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, emailOnNewDevice: checked }
    }));
  }, [setPolicies]);

  const handleEmailOnSuspiciousChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, emailOnSuspicious: checked }
    }));
  }, [setPolicies]);

  const handleEmailOnPolicyViolationChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, emailOnPolicyViolation: checked }
    }));
  }, [setPolicies]);

  const handleNotifyAdminsOnCriticalChange = useCallback((checked: boolean) => {
    setPolicies((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, notifyAdminsOnCritical: checked }
    }));
  }, [setPolicies]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <CardTitle className="text-base">Notifications</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Email on New Device</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Send email when user logs in from new device</p>
          </div>
          <Switch
            checked={policies.notifications.emailOnNewDevice}
            onCheckedChange={handleEmailOnNewDeviceChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Email on Suspicious Activity</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Send email when suspicious activity is detected</p>
          </div>
          <Switch
            checked={policies.notifications.emailOnSuspicious}
            onCheckedChange={handleEmailOnSuspiciousChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Email on Policy Violation</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Send email when access policy is violated</p>
          </div>
          <Switch
            checked={policies.notifications.emailOnPolicyViolation}
            onCheckedChange={handleEmailOnPolicyViolationChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Notify Admins on Critical Threats</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Send email to admins when critical security threat is detected
            </p>
          </div>
          <Switch
            checked={policies.notifications.notifyAdminsOnCritical}
            onCheckedChange={handleNotifyAdminsOnCriticalChange}
          />
        </div>
      </CardContent>
    </Card>
  );
});

NotificationsCard.displayName = 'NotificationsCard';

