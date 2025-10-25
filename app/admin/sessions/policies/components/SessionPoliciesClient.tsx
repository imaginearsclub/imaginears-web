'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Switch } from '@/components/common';
import { Save, Shield, Clock, MapPin, Monitor, Bell, Lock, AlertTriangle } from 'lucide-react';

interface SessionPolicies {
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

interface Props {
  initialPolicies: SessionPolicies;
}

export function SessionPoliciesClient({ initialPolicies }: Props) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In production, save to API
      // const response = await fetch('/api/admin/sessions/policies', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(policies),
      // });
      
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save policies:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* Session Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle className="text-base">Session Limits</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
              Max Concurrent Sessions per User
            </label>
            <Input
              type="number"
              value={policies.maxConcurrentSessions}
              onChange={(e) => setPolicies(prev => ({
                ...prev,
                maxConcurrentSessions: parseInt(e.target.value) || 1
              }))}
              min="1"
              max="50"
              className="w-32"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Oldest sessions will be automatically terminated when limit is exceeded
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
              Session Idle Timeout (minutes)
            </label>
            <Input
              type="number"
              value={policies.sessionIdleTimeout}
              onChange={(e) => setPolicies(prev => ({
                ...prev,
                sessionIdleTimeout: parseInt(e.target.value) || 5
              }))}
              min="5"
              max="1440"
              className="w-32"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Sessions will expire after this period of inactivity
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
              Remember Me Duration (days)
            </label>
            <Input
              type="number"
              value={policies.rememberMeDuration}
              onChange={(e) => setPolicies(prev => ({
                ...prev,
                rememberMeDuration: parseInt(e.target.value) || 1
              }))}
              min="1"
              max="365"
              className="w-32"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              How long "Remember Me" sessions remain valid
            </p>
          </div>
        </CardContent>
      </Card>

      {/* IP Restrictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle className="text-base">IP Restrictions</CardTitle>
            </div>
            <Switch
              checked={policies.ipRestrictions.enabled}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                ipRestrictions: { ...prev.ipRestrictions, enabled: checked }
              }))}
            />
          </div>
        </CardHeader>
        {policies.ipRestrictions.enabled && (
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Whitelist (comma-separated IPs or CIDR ranges)
              </label>
              <Input
                placeholder="e.g., 192.168.1.0/24, 10.0.0.1"
                value={policies.ipRestrictions.whitelist.join(', ')}
                onChange={(e) => setPolicies(prev => ({
                  ...prev,
                  ipRestrictions: {
                    ...prev.ipRestrictions,
                    whitelist: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }
                }))}
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Only these IPs can access (leave empty to allow all except blacklist)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Blacklist (comma-separated IPs or CIDR ranges)
              </label>
              <Input
                placeholder="e.g., 192.168.1.100, 10.0.0.0/8"
                value={policies.ipRestrictions.blacklist.join(', ')}
                onChange={(e) => setPolicies(prev => ({
                  ...prev,
                  ipRestrictions: {
                    ...prev.ipRestrictions,
                    blacklist: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }
                }))}
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                These IPs will be blocked from accessing the system
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Geographic Restrictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <CardTitle className="text-base">Geographic Restrictions</CardTitle>
            </div>
            <Switch
              checked={policies.geoFencing.enabled}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                geoFencing: { ...prev.geoFencing, enabled: checked }
              }))}
            />
          </div>
        </CardHeader>
        {policies.geoFencing.enabled && (
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Allowed Countries (comma-separated country codes)
              </label>
              <Input
                placeholder="e.g., US, CA, GB, DE"
                value={policies.geoFencing.allowedCountries.join(', ')}
                onChange={(e) => setPolicies(prev => ({
                  ...prev,
                  geoFencing: {
                    ...prev.geoFencing,
                    allowedCountries: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                  }
                }))}
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Leave empty to allow all countries except blocked ones
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Blocked Countries (comma-separated country codes)
              </label>
              <Input
                placeholder="e.g., CN, RU, KP"
                value={policies.geoFencing.blockedCountries.join(', ')}
                onChange={(e) => setPolicies(prev => ({
                  ...prev,
                  geoFencing: {
                    ...prev.geoFencing,
                    blockedCountries: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                  }
                }))}
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Users from these countries will be blocked
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Time-Based Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <CardTitle className="text-base">Time-Based Access Control</CardTitle>
            </div>
            <Switch
              checked={policies.timeBasedAccess.enabled}
              onCheckedChange={(checked) => setPolicies(prev => ({
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
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                  Start Hour (0-23)
                </label>
                <Input
                  type="number"
                  value={policies.timeBasedAccess.allowedHours.start}
                  onChange={(e) => setPolicies(prev => ({
                    ...prev,
                    timeBasedAccess: {
                      ...prev.timeBasedAccess,
                      allowedHours: {
                        ...prev.timeBasedAccess.allowedHours,
                        start: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                      }
                    }
                  }))}
                  min="0"
                  max="23"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                  End Hour (0-23)
                </label>
                <Input
                  type="number"
                  value={policies.timeBasedAccess.allowedHours.end}
                  onChange={(e) => setPolicies(prev => ({
                    ...prev,
                    timeBasedAccess: {
                      ...prev.timeBasedAccess,
                      allowedHours: {
                        ...prev.timeBasedAccess.allowedHours,
                        end: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                      }
                    }
                  }))}
                  min="0"
                  max="23"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Timezone
              </label>
              <select
                value={policies.timeBasedAccess.timezone}
                onChange={(e) => setPolicies(prev => ({
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

      {/* Device Restrictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              <CardTitle className="text-base">Device Restrictions</CardTitle>
            </div>
            <Switch
              checked={policies.deviceRestrictions.enabled}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                deviceRestrictions: { ...prev.deviceRestrictions, enabled: checked }
              }))}
            />
          </div>
        </CardHeader>
        {policies.deviceRestrictions.enabled && (
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Allowed Device Types
              </label>
              <div className="space-y-2">
                {['desktop', 'mobile', 'tablet'].map(type => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={policies.deviceRestrictions.allowedTypes.includes(type)}
                      onChange={(e) => {
                        setPolicies(prev => ({
                          ...prev,
                          deviceRestrictions: {
                            ...prev.deviceRestrictions,
                            allowedTypes: e.target.checked
                              ? [...prev.deviceRestrictions.allowedTypes, type]
                              : prev.deviceRestrictions.allowedTypes.filter(t => t !== type)
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
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  Require Trusted Device
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Users must mark their device as trusted before use
                </p>
              </div>
              <Switch
                checked={policies.deviceRestrictions.requireTrustedDevice}
                onCheckedChange={(checked) => setPolicies(prev => ({
                  ...prev,
                  deviceRestrictions: { ...prev.deviceRestrictions, requireTrustedDevice: checked }
                }))}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Security Features */}
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
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Auto-Block Suspicious Sessions
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Automatically terminate sessions flagged as suspicious
              </p>
            </div>
            <Switch
              checked={policies.securityFeatures.autoBlockSuspicious}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                securityFeatures: { ...prev.securityFeatures, autoBlockSuspicious: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Require Re-auth After Suspicious Activity
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Force users to log in again after suspicious activity is detected
              </p>
            </div>
            <Switch
              checked={policies.securityFeatures.requireReauthAfterSuspicious}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                securityFeatures: { ...prev.securityFeatures, requireReauthAfterSuspicious: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                VPN Detection
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Detect and flag commercial VPN usage
              </p>
            </div>
            <Switch
              checked={policies.securityFeatures.enableVpnDetection}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                securityFeatures: { ...prev.securityFeatures, enableVpnDetection: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Impossible Travel Detection
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Detect logins from geographically impossible locations
              </p>
            </div>
            <Switch
              checked={policies.securityFeatures.enableImpossibleTravelDetection}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                securityFeatures: { ...prev.securityFeatures, enableImpossibleTravelDetection: checked }
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Max Failed Login Attempts
              </label>
              <Input
                type="number"
                value={policies.securityFeatures.maxFailedLogins}
                onChange={(e) => setPolicies(prev => ({
                  ...prev,
                  securityFeatures: {
                    ...prev.securityFeatures,
                    maxFailedLogins: Math.max(1, parseInt(e.target.value) || 5)
                  }
                }))}
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Time Window (minutes)
              </label>
              <Input
                type="number"
                value={policies.securityFeatures.failedLoginWindow}
                onChange={(e) => setPolicies(prev => ({
                  ...prev,
                  securityFeatures: {
                    ...prev.securityFeatures,
                    failedLoginWindow: Math.max(1, parseInt(e.target.value) || 15)
                  }
                }))}
                min="1"
                max="1440"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
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
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Email on New Device
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Send email when user logs in from new device
              </p>
            </div>
            <Switch
              checked={policies.notifications.emailOnNewDevice}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                notifications: { ...prev.notifications, emailOnNewDevice: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Email on Suspicious Activity
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Send email when suspicious activity is detected
              </p>
            </div>
            <Switch
              checked={policies.notifications.emailOnSuspicious}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                notifications: { ...prev.notifications, emailOnSuspicious: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Email on Policy Violation
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Send email when access policy is violated
              </p>
            </div>
            <Switch
              checked={policies.notifications.emailOnPolicyViolation}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                notifications: { ...prev.notifications, emailOnPolicyViolation: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Notify Admins on Critical Threats
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Send email to admins when critical security threat is detected
              </p>
            </div>
            <Switch
              checked={policies.notifications.notifyAdminsOnCritical}
              onCheckedChange={(checked) => setPolicies(prev => ({
                ...prev,
                notifications: { ...prev.notifications, notifyAdminsOnCritical: checked }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      <div className="p-4 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-orange-900 dark:text-orange-100 text-sm mb-1">
              Important Security Notice
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              These policies affect all users system-wide. Restrictive policies may lock out legitimate users. 
              Test thoroughly before deploying to production. Consider creating exception rules for administrators.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

