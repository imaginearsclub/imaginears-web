import { Card, CardContent, CardHeader, CardTitle, Input, Switch } from '@/components/common';
import { MapPin } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';

export function GeoRestrictionsCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <CardTitle className="text-base">Geographic Restrictions</CardTitle>
          </div>
          <Switch
            checked={policies.geoFencing.enabled}
            onCheckedChange={(checked) => setPolicies((prev) => ({
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
              onChange={(e) => setPolicies((prev) => ({
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
              onChange={(e) => setPolicies((prev) => ({
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
  );
}

