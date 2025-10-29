import { Card, CardContent, CardHeader, CardTitle, Input, Switch, Badge } from '@/components/common';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';
import { useState } from 'react';
import IPCIDR from 'ip-cidr';

function validateIP(ip: string): boolean {
  try {
    // Check if it's a single IP or CIDR notation
    if (ip.includes('/')) {
      // CIDR notation - validate using ip-cidr
      // If construction succeeds, it's valid
      new IPCIDR(ip);
      return true;
    } else {
      // Single IP - try as IPv4 first, then IPv6
      try {
        new IPCIDR(`${ip}/32`); // IPv4
        return true;
      } catch {
        new IPCIDR(`${ip}/128`); // IPv6
        return true;
      }
    }
  } catch {
    return false;
  }
}

function IPInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  description 
}: { 
  label: string; 
  value: string[]; 
  onChange: (ips: string[]) => void; // eslint-disable-line no-unused-vars
  placeholder: string;
  description: string;
}) {
  const [inputValue, setInputValue] = useState(value.join(', '));
  const [validationState, setValidationState] = useState<'valid' | 'invalid' | 'idle'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const ips = newValue.split(',').map(s => s.trim()).filter(Boolean);
    
    if (ips.length === 0) {
      setValidationState('idle');
      onChange([]);
      return;
    }
    
    const allValid = ips.every(validateIP);
    setValidationState(allValid ? 'valid' : 'invalid');
    
    if (allValid) {
      onChange(ips);
    }
  };

  // Calculate current IPs for display
  const currentIps = inputValue.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </label>
        {validationState !== 'idle' && (
          <Badge variant={validationState === 'valid' ? 'success' : 'danger'} size="sm">
            {validationState === 'valid' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Valid
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Invalid IP format
              </>
            )}
          </Badge>
        )}
      </div>
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        className={
          validationState === 'invalid' 
            ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' 
            : ''
        }
      />
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        {description}
      </p>
      {validationState === 'valid' && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ Valid IP address{currentIps.length > 1 ? 'es' : ''} (IPv4/IPv6 supported)
        </p>
      )}
      {validationState === 'invalid' && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Please enter valid IPv4/IPv6 addresses or CIDR notation (e.g., 192.168.1.0/24, 2001:db8::/32)
        </p>
      )}
    </div>
  );
}

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
          <IPInput
            label="Whitelist (comma-separated IPs or CIDR ranges)"
            value={policies.ipRestrictions.whitelist}
            onChange={(ips) => setPolicies((prev) => ({
              ...prev,
              ipRestrictions: { ...prev.ipRestrictions, whitelist: ips }
            }))}
            placeholder="e.g., 192.168.1.0/24, 10.0.0.1, 2001:db8::/32"
            description="Only these IPs can access (leave empty to allow all except blacklist). Supports IPv4 and IPv6."
          />
          <IPInput
            label="Blacklist (comma-separated IPs or CIDR ranges)"
            value={policies.ipRestrictions.blacklist}
            onChange={(ips) => setPolicies((prev) => ({
              ...prev,
              ipRestrictions: { ...prev.ipRestrictions, blacklist: ips }
            }))}
            placeholder="e.g., 192.168.1.100, 10.0.0.0/8, 2001:db8::1"
            description="These IPs will be blocked from accessing the system. Supports IPv4 and IPv6."
          />
        </CardContent>
      )}
    </Card>
  );
}

