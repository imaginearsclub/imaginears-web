import { Card, CardContent, CardHeader, CardTitle, Input, Switch, Badge, Button } from '@/components/common';
import { Shield, X, Plus, Network } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';
import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import IPCIDR from 'ip-cidr';
import { addSentryBreadcrumb } from '@/lib/sentry-helpers';
import * as Sentry from '@sentry/nextjs';

// Common network ranges for quick selection
const COMMON_RANGES: Record<string, string[]> = {
  'Private Networks': ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
  'Localhost': ['127.0.0.1', '::1'],
  'Link-Local': ['169.254.0.0/16', 'fe80::/10'],
  'Documentation': ['192.0.2.0/24', '198.51.100.0/24', '203.0.113.0/24', '2001:db8::/32'],
};

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

function getIPType(ip: string): 'IPv4' | 'IPv6' | 'CIDR-v4' | 'CIDR-v6' | 'Unknown' {
  try {
    const isCIDR = ip.includes('/');
    const isIPv6 = ip.includes(':');
    
    if (isIPv6) {
      return isCIDR ? 'CIDR-v6' : 'IPv6';
    } else {
      return isCIDR ? 'CIDR-v4' : 'IPv4';
    }
  } catch {
    return 'Unknown';
  }
}

// Calculate CIDR size without loading entire array into memory
function calculateCIDRSize(cidr: string): number {
  const [, prefix] = cidr.split('/');
  const prefixLength = parseInt(prefix || '0', 10);
  const isIPv6 = cidr.includes(':');
  
  if (isIPv6) {
    // IPv6: 2^(128 - prefix)
    const bits = 128 - prefixLength;
    // For large IPv6 ranges, return a symbolic value
    if (bits > 32) return Number.MAX_SAFE_INTEGER;
    return Math.pow(2, bits);
  } else {
    // IPv4: 2^(32 - prefix)
    const bits = 32 - prefixLength;
    return Math.pow(2, bits);
  }
}

function getIPRangeInfo(ip: string): string | null {
  try {
    if (!ip.includes('/')) return null;
    
    const cidr = new IPCIDR(ip);
    const start = cidr.start();
    const end = cidr.end();
    const isIPv6 = ip.includes(':');
    
    // For IPv4 ranges, show the number of IPs (calculated, not loaded)
    if (!isIPv6) {
      const size = calculateCIDRSize(ip);
      if (size <= 256) {
        return `${size} IPs: ${start} - ${end}`;
      }
      return `${size.toLocaleString()} IPs`;
    }
    
    // For IPv6, just show the range
    return `Range: ${start} - ${end}`;
  } catch {
    return null;
  }
}

// Memoization cache for IP metadata (prevents recalculation on every render)
const ipMetadataCache = new Map<string, { type: string; rangeInfo: string | null }>();

function getIPMetadata(ip: string) {
  if (ipMetadataCache.has(ip)) {
    return ipMetadataCache.get(ip)!;
  }
  
  const metadata = {
    type: getIPType(ip),
    rangeInfo: getIPRangeInfo(ip),
  };
  
  // Limit cache size to prevent memory growth
  if (ipMetadataCache.size > 1000) {
    const firstKey = ipMetadataCache.keys().next().value;
    if (firstKey) {
      ipMetadataCache.delete(firstKey);
    }
  }
  
  ipMetadataCache.set(ip, metadata);
  return metadata;
}

// Individual IP Tag component (memoized)
const IPTag = memo(({ 
  ip, 
  onRemove 
}: { 
  ip: string; 
  onRemove: (ip: string) => void; // eslint-disable-line no-unused-vars
}) => {
  const { type, rangeInfo } = getIPMetadata(ip);
  const typeColor = type.includes('v6') ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400';
  
  return (
    <Badge 
      variant="default" 
      size="sm"
      className="flex items-center gap-1 pr-1 group"
    >
      <span className="font-mono">{ip}</span>
      <span className={`text-[10px] ${typeColor} font-semibold`}>
        {type}
      </span>
      {rangeInfo && (
        <span className="text-[10px] opacity-75 max-w-[200px] truncate" title={rangeInfo}>
          ({rangeInfo})
        </span>
      )}
      <button
        onClick={() => onRemove(ip)}
        className="ml-1 hover:bg-slate-700 dark:hover:bg-slate-600 rounded p-0.5 transition-colors"
        aria-label={`Remove ${ip}`}
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
});

IPTag.displayName = 'IPTag';

// Sub-components (memoized)
const IPTags = memo(({ 
  ips, 
  onRemove 
}: { 
  ips: string[]; 
  onRemove: (ip: string) => void; // eslint-disable-line no-unused-vars
}) => {
  if (ips.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5 mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      {ips.map((ip) => (
        <IPTag key={ip} ip={ip} onRemove={onRemove} />
      ))}
    </div>
  );
});

IPTags.displayName = 'IPTags';

const QuickNetworkRanges = memo(({ 
  onAdd 
}: { 
  onAdd: (ranges: string[]) => void; // eslint-disable-line no-unused-vars
}) => {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
        Quick add common ranges:
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(COMMON_RANGES).map(([name, ranges]) => (
          <Button
            key={name}
            onClick={() => onAdd(ranges)}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <Network className="w-3 h-3 mr-1" />
            {name}
          </Button>
        ))}
      </div>
    </div>
  );
});

QuickNetworkRanges.displayName = 'QuickNetworkRanges';

// Main IP input component with smart features
// eslint-disable-next-line max-lines-per-function
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
  const [inputValue, setInputValue] = useState('');
  const [validationState, setValidationState] = useState<'valid' | 'invalid' | 'idle'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // Track IP changes in Sentry (memoized)
  const trackIPAction = useCallback((action: string, ips: string[]) => {
    addSentryBreadcrumb(`IP restrictions: ${action}`, {
      ips: ips.join(', '),
      count: ips.length,
    });
  }, []);

  // Validate input as user types
  useEffect(() => {
    if (!inputValue) {
      setValidationState('idle');
      return;
    }

    const isValid = validateIP(inputValue.trim());
    setValidationState(isValid ? 'valid' : 'invalid');
  }, [inputValue]);

  // Add IP (memoized)
  const addIP = useCallback((ip: string) => {
    const trimmed = ip.trim();
    
    if (!validateIP(trimmed)) {
      Sentry.captureMessage('Invalid IP/CIDR entered', {
        level: 'warning',
        extra: { ip: trimmed, context: 'IpRestrictionsCard' },
      });
      return;
    }

    if (!value.includes(trimmed)) {
      const newIPs = [...value, trimmed];
      onChange(newIPs);
      trackIPAction('added IP', [trimmed]);
    }

    setInputValue('');
    setValidationState('idle');
  }, [value, onChange, trackIPAction]);

  // Remove IP (memoized)
  const removeIP = useCallback((ip: string) => {
    const newIPs = value.filter(i => i !== ip);
    onChange(newIPs);
    trackIPAction('removed IP', [ip]);
  }, [value, onChange, trackIPAction]);

  // Add multiple IPs (memoized)
  const addMultipleIPs = useCallback((ips: string[]) => {
    const newIPs = Array.from(new Set([...value, ...ips]));
    onChange(newIPs);
    trackIPAction('added quick range', ips);
  }, [value, onChange, trackIPAction]);

  // Clear all (memoized)
  const clearAll = useCallback(() => {
    onChange([]);
    trackIPAction('cleared all IPs', value);
  }, [value, onChange, trackIPAction]);

  // Handle Enter key (memoized)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue && validationState === 'valid') {
      e.preventDefault();
      addIP(inputValue);
    }
  }, [inputValue, validationState, addIP]);

  // Calculate stats (memoized - expensive for large lists)
  const { ipv4Count, ipv6Count } = useMemo(() => {
    let v4 = 0;
    let v6 = 0;
    
    for (const ip of value) {
      const { type } = getIPMetadata(ip);
      if (type.includes('v4')) v4++;
      else if (type.includes('v6')) v6++;
    }
    
    return { ipv4Count: v4, ipv6Count: v6 };
  }, [value]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {value.length} {value.length === 1 ? 'entry' : 'entries'}
          </Badge>
          {ipv4Count > 0 && (
            <Badge variant="default" size="sm" className="text-blue-600 dark:text-blue-400">
              {ipv4Count} IPv4
            </Badge>
          )}
          {ipv6Count > 0 && (
            <Badge variant="default" size="sm" className="text-purple-600 dark:text-purple-400">
              {ipv6Count} IPv6
            </Badge>
          )}
          {value.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* IP Tags */}
      <IPTags ips={value} onRemove={removeIP} />

      {/* Input with Add Button */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={
                validationState === 'invalid' 
                  ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
                  : validationState === 'valid'
                  ? 'border-green-500 dark:border-green-500 focus:border-green-500 focus:ring-green-500'
                  : ''
              }
            />
            {/* Real-time validation feedback */}
            {inputValue && validationState === 'valid' && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 dark:text-green-400">
                <span className="text-[10px] font-semibold">{getIPType(inputValue)}</span>
              </div>
            )}
          </div>
          <Button
            onClick={() => inputValue && addIP(inputValue)}
            variant="outline"
            size="sm"
            disabled={!inputValue || validationState !== 'valid'}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        {description}
      </p>

      {/* Validation Message */}
      {validationState === 'invalid' && inputValue && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Invalid format. Examples: 192.168.1.1, 10.0.0.0/8, 2001:db8::1, 2001:db8::/32
        </p>
      )}

      {/* Quick Actions */}
      <QuickNetworkRanges onAdd={addMultipleIPs} />

      {/* Helper Text */}
      {value.length === 0 && (
        <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 Enter IPv4, IPv6, or CIDR notation (e.g., 192.168.1.0/24 or 2001:db8::/32)
          </p>
        </div>
      )}
    </div>
  );
}

export function IpRestrictionsCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
  // Memoize handlers to prevent unnecessary re-renders
  const handleToggle = useCallback((checked: boolean) => {
    // Track toggle in Sentry
    addSentryBreadcrumb('IP restrictions toggled', {
      enabled: checked,
      whitelistCount: policies.ipRestrictions.whitelist.length,
      blacklistCount: policies.ipRestrictions.blacklist.length,
    });

    setPolicies((prev) => ({
      ...prev,
      ipRestrictions: { ...prev.ipRestrictions, enabled: checked }
    }));
  }, [policies.ipRestrictions.whitelist.length, policies.ipRestrictions.blacklist.length, setPolicies]);

  const handleWhitelistChange = useCallback((ips: string[]) => {
    setPolicies((prev) => ({
      ...prev,
      ipRestrictions: { ...prev.ipRestrictions, whitelist: ips }
    }));
  }, [setPolicies]);

  const handleBlacklistChange = useCallback((ips: string[]) => {
    setPolicies((prev) => ({
      ...prev,
      ipRestrictions: { ...prev.ipRestrictions, blacklist: ips }
    }));
  }, [setPolicies]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <CardTitle className="text-base">IP Restrictions</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control access by IP address or network range
              </p>
            </div>
          </div>
          <Switch
            checked={policies.ipRestrictions.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>
      {policies.ipRestrictions.enabled && (
        <CardContent className="space-y-6">
          <IPInput
            label="Whitelist"
            value={policies.ipRestrictions.whitelist}
            onChange={handleWhitelistChange}
            placeholder="e.g., 192.168.1.0/24 or 2001:db8::/32"
            description="Only these IPs/ranges can access. Leave empty to allow all except blacklist."
          />
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <IPInput
              label="Blacklist"
              value={policies.ipRestrictions.blacklist}
              onChange={handleBlacklistChange}
              placeholder="e.g., 10.0.0.1 or fe80::/10"
              description="These IPs/ranges will be denied access"
            />
          </div>

          {/* Policy Summary */}
          {(policies.ipRestrictions.whitelist.length > 0 || policies.ipRestrictions.blacklist.length > 0) && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                🛡️ Current Policy:
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {policies.ipRestrictions.whitelist.length > 0 
                  ? `Access limited to ${policies.ipRestrictions.whitelist.length} ${policies.ipRestrictions.whitelist.length === 1 ? 'entry' : 'entries'} (whitelist)`
                  : 'All IPs allowed'}
                {policies.ipRestrictions.blacklist.length > 0 && 
                  `, with ${policies.ipRestrictions.blacklist.length} ${policies.ipRestrictions.blacklist.length === 1 ? 'entry' : 'entries'} blocked`}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

