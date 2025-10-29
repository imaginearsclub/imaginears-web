import { Card, CardContent, CardHeader, CardTitle, Input, Switch } from '@/components/common';
import { Clock, Monitor, Lock, Bell } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';

export function TimeBasedAccessCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle className="text-base">Time-Based Access Control</CardTitle>
          </div>
          <Switch
            checked={policies.timeBasedAccess.enabled}
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              timeBasedAccess: { ...prev.timeBasedAccess, enabled: checked }
            }))}
          />
        </div>
      </CardHeader>
      {policies.timeBasedAccess.enabled && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Start Hour (0-23)</label>
              <Input
                type="number"
                value={policies.timeBasedAccess.allowedHours.start}
                onChange={(e) => setPolicies((prev) => ({
                  ...prev,
                  timeBasedAccess: {
                    ...prev.timeBasedAccess,
                    allowedHours: { ...prev.timeBasedAccess.allowedHours, start: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)) }
                  }
                }))}
                min="0"
                max="23"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">End Hour (0-23)</label>
              <Input
                type="number"
                value={policies.timeBasedAccess.allowedHours.end}
                onChange={(e) => setPolicies((prev) => ({
                  ...prev,
                  timeBasedAccess: {
                    ...prev.timeBasedAccess,
                    allowedHours: { ...prev.timeBasedAccess.allowedHours, end: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)) }
                  }
                }))}
                min="0"
                max="23"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Timezone</label>
            <select
              value={policies.timeBasedAccess.timezone}
              onChange={(e) => setPolicies((prev) => ({
                ...prev,
                timeBasedAccess: { ...prev.timeBasedAccess, timezone: e.target.value }
              }))}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Users can only access the system during these hours
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export function DeviceRestrictionsCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            <CardTitle className="text-base">Device Restrictions</CardTitle>
          </div>
          <Switch
            checked={policies.deviceRestrictions.enabled}
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              deviceRestrictions: { ...prev.deviceRestrictions, enabled: checked }
            }))}
          />
        </div>
      </CardHeader>
      {policies.deviceRestrictions.enabled && (
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Allowed Device Types</label>
            <div className="space-y-2">
              {['desktop', 'mobile', 'tablet'].map(type => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={policies.deviceRestrictions.allowedTypes.includes(type)}
                    onChange={(e) => {
                      setPolicies((prev) => ({
                        ...prev,
                        deviceRestrictions: {
                          ...prev.deviceRestrictions,
                          allowedTypes: e.target.checked
                            ? [...prev.deviceRestrictions.allowedTypes, type]
                            : prev.deviceRestrictions.allowedTypes.filter((t) => t !== type)
                        }
                      }));
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-900 dark:text-white capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">Require Trusted Device</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Users must mark their device as trusted before use
              </p>
            </div>
            <Switch
              checked={policies.deviceRestrictions.requireTrustedDevice}
              onCheckedChange={(checked) => setPolicies((prev) => ({
                ...prev,
                deviceRestrictions: { ...prev.deviceRestrictions, requireTrustedDevice: checked }
              }))}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function SecurityFeaturesCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
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
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              securityFeatures: { ...prev.securityFeatures, autoBlockSuspicious: checked }
            }))}
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
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              securityFeatures: { ...prev.securityFeatures, requireReauthAfterSuspicious: checked }
            }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">VPN Detection</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Detect and flag commercial VPN usage</p>
          </div>
          <Switch
            checked={policies.securityFeatures.enableVpnDetection}
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              securityFeatures: { ...prev.securityFeatures, enableVpnDetection: checked }
            }))}
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
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              securityFeatures: { ...prev.securityFeatures, enableImpossibleTravelDetection: checked }
            }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Max Failed Login Attempts</label>
            <Input
              type="number"
              value={policies.securityFeatures.maxFailedLogins}
              onChange={(e) => setPolicies((prev) => ({
                ...prev,
                securityFeatures: { ...prev.securityFeatures, maxFailedLogins: Math.max(1, parseInt(e.target.value) || 5) }
              }))}
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Time Window (minutes)</label>
            <Input
              type="number"
              value={policies.securityFeatures.failedLoginWindow}
              onChange={(e) => setPolicies((prev) => ({
                ...prev,
                securityFeatures: { ...prev.securityFeatures, failedLoginWindow: Math.max(1, parseInt(e.target.value) || 15) }
              }))}
              min="1"
              max="1440"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
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
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, emailOnNewDevice: checked }
            }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Email on Suspicious Activity</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Send email when suspicious activity is detected</p>
          </div>
          <Switch
            checked={policies.notifications.emailOnSuspicious}
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, emailOnSuspicious: checked }
            }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Email on Policy Violation</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Send email when access policy is violated</p>
          </div>
          <Switch
            checked={policies.notifications.emailOnPolicyViolation}
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, emailOnPolicyViolation: checked }
            }))}
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
            onCheckedChange={(checked) => setPolicies((prev) => ({
              ...prev,
              notifications: { ...prev.notifications, notifyAdminsOnCritical: checked }
            }))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

