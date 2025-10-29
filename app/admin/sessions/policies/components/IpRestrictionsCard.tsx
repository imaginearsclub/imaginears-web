import { Card, CardContent, CardHeader, CardTitle, Input, Switch } from '@/components/common';
import { Shield } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';

export function IpRestrictionsCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle className="text-base">IP Restrictions</CardTitle>
          </div>
          <Switch
            checked={policies.ipRestrictions.enabled}
            onCheckedChange={(checked) => setPolicies((prev) => ({
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
              onChange={(e) => setPolicies((prev) => ({
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
              onChange={(e) => setPolicies((prev) => ({
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
  );
}

