import { Card, CardContent, CardHeader, CardTitle, Input, Switch, Badge, Button } from '@/components/common';
import { MapPin, X, Globe, Plus } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';
import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { addSentryBreadcrumb } from '@/lib/sentry-helpers';
import * as Sentry from '@sentry/nextjs';

// Register English locale for country names
countries.registerLocale(enLocale);

function validateCountryCode(code: string): boolean {
  // Use i18n-iso-countries for comprehensive validation
  return countries.isValid(code);
}

// Cache for country list (expensive to generate)
let cachedCountryList: Array<{ code: string; name: string }> | null = null;

// Get all country codes and names for autocomplete (cached)
function getAllCountries(): Array<{ code: string; name: string }> {
  if (cachedCountryList) {
    return cachedCountryList;
  }
  
  const countryNames = countries.getNames('en', { select: 'official' });
  cachedCountryList = Object.entries(countryNames).map(([code, name]) => ({
    code,
    name: name as string,
  })).sort((a, b) => a.name.localeCompare(b.name));
  
  return cachedCountryList;
}

// Cache for country names (prevent repeated lookups)
const countryNameCache = new Map<string, string | null>();

function getCountryNameCached(code: string): string | null {
  if (countryNameCache.has(code)) {
    return countryNameCache.get(code)!;
  }
  
  const name = countries.getName(code, 'en', { select: 'official' }) || null;
  countryNameCache.set(code, name);
  return name;
}

// Regional groupings for quick selection
const REGIONS: Record<string, string[]> = {
  'North America': ['US', 'CA', 'MX'],
  'Europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'IE'],
  'Asia-Pacific': ['JP', 'CN', 'IN', 'AU', 'NZ', 'SG', 'KR', 'TH', 'VN', 'MY', 'ID', 'PH'],
  'Latin America': ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI'],
  'Middle East': ['AE', 'SA', 'IL', 'TR', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LB', 'OM', 'QA', 'YE'],
  'Africa': ['ZA', 'NG', 'EG', 'KE', 'ET', 'GH', 'TZ', 'UG', 'DZ', 'MA', 'AO', 'SD', 'MZ', 'MG', 'CM'],
};

// Individual Country Tag component (memoized)
const CountryTag = memo(({ 
  code, 
  onRemove 
}: { 
  code: string; 
  onRemove: (code: string) => void; // eslint-disable-line no-unused-vars
}) => {
  const name = getCountryNameCached(code);
  
  return (
    <Badge 
      variant="default" 
      size="sm"
      className="flex items-center gap-1 pr-1"
    >
      <span>{code}</span>
      {name && <span className="text-xs opacity-75">({name})</span>}
      <button
        onClick={() => onRemove(code)}
        className="ml-1 hover:bg-slate-700 dark:hover:bg-slate-600 rounded p-0.5 transition-colors"
        aria-label={`Remove ${code}`}
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
});

CountryTag.displayName = 'CountryTag';

// Sub-components for CountryInput (memoized)
const CountryTags = memo(({ 
  countries, 
  onRemove 
}: { 
  countries: string[]; 
  onRemove: (code: string) => void; // eslint-disable-line no-unused-vars
}) => {
  if (countries.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5 mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      {countries.map((code) => (
        <CountryTag key={code} code={code} onRemove={onRemove} />
      ))}
    </div>
  );
});

CountryTags.displayName = 'CountryTags';

const AutocompleteDropdown = memo(({
  suggestions,
  onSelect,
  dropdownRef,
}: {
  suggestions: Array<{ code: string; name: string }>;
  onSelect: (code: string) => void; // eslint-disable-line no-unused-vars
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) => {
  if (suggestions.length === 0) return null;
  
  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
    >
      {suggestions.map((country) => (
        <button
          key={country.code}
          onClick={() => onSelect(country.code)}
          className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
        >
          <span className="text-sm text-slate-900 dark:text-white">
            {country.name}
          </span>
          <Badge variant="default" size="sm">
            {country.code}
          </Badge>
        </button>
      ))}
    </div>
  );
});

AutocompleteDropdown.displayName = 'AutocompleteDropdown';

const RegionalQuickActions = memo(({ 
  onAddRegion 
}: { 
  onAddRegion: (region: string) => void; // eslint-disable-line no-unused-vars
}) => {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
        Quick add by region:
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.keys(REGIONS).map((region) => (
          <Button
            key={region}
            onClick={() => onAddRegion(region)}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <Globe className="w-3 h-3 mr-1" />
            {region}
          </Button>
        ))}
      </div>
    </div>
  );
});

RegionalQuickActions.displayName = 'RegionalQuickActions';

// Main country input component with autocomplete and regional quick actions
// eslint-disable-next-line max-lines-per-function
function CountryInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  description 
}: { 
  label: string; 
  value: string[]; 
  onChange: (countries: string[]) => void; // eslint-disable-line no-unused-vars
  placeholder: string;
  description: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ code: string; name: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cache the country list (expensive operation)
  const allCountries = useMemo(() => getAllCountries(), []);

  // Track country selection in Sentry (memoized)
  const trackCountryAction = useCallback((action: string, countryCodes: string[]) => {
    addSentryBreadcrumb(`Geo restrictions: ${action}`, {
      countries: countryCodes.join(', '),
      count: countryCodes.length,
    });
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions based on input (memoized)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (query.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Search countries by code or name (now uses cached list)
    const filtered = allCountries
      .filter(country => 
        country.code.toLowerCase().startsWith(query.toLowerCase()) ||
        country.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 suggestions

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [allCountries]);

  // Add country from suggestion or manual input (memoized)
  const addCountry = useCallback((code: string) => {
    const upperCode = code.toUpperCase();
    
    if (!validateCountryCode(upperCode)) {
      Sentry.captureMessage('Invalid country code entered', {
        level: 'warning',
        extra: { code: upperCode, context: 'GeoRestrictionsCard' },
      });
      return;
    }

    if (!value.includes(upperCode)) {
      const newCountries = [...value, upperCode];
      onChange(newCountries);
      trackCountryAction('added country', [upperCode]);
    }

    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [value, onChange, trackCountryAction]);

  // Remove country (memoized)
  const removeCountry = useCallback((code: string) => {
    const newCountries = value.filter(c => c !== code);
    onChange(newCountries);
    trackCountryAction('removed country', [code]);
  }, [value, onChange, trackCountryAction]);

  // Add region (memoized)
  const addRegion = useCallback((regionName: string) => {
    // eslint-disable-next-line security/detect-object-injection
    const regionCountries = REGIONS[regionName];
    if (!regionCountries) return; // Guard against invalid keys
    
    const newCountries = Array.from(new Set([...value, ...regionCountries]));
    onChange(newCountries);
    trackCountryAction(`added region: ${regionName}`, regionCountries);
  }, [value, onChange, trackCountryAction]);

  // Handle Enter key (memoized)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      if (suggestions.length > 0) {
        addCountry(suggestions[0]!.code);
      } else {
        addCountry(inputValue);
      }
    }
  }, [inputValue, suggestions, addCountry]);

  // Clear all (memoized)
  const clearAll = useCallback(() => {
    onChange([]);
    trackCountryAction('cleared all countries', value);
  }, [value, onChange, trackCountryAction]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {value.length} {value.length === 1 ? 'country' : 'countries'}
          </Badge>
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

      {/* Country Tags */}
      <CountryTags countries={value} onRemove={removeCountry} />

      {/* Input with Autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue && setShowSuggestions(suggestions.length > 0)}
            />
            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <AutocompleteDropdown
                suggestions={suggestions}
                onSelect={addCountry}
                dropdownRef={dropdownRef}
              />
            )}
          </div>
          <Button
            onClick={() => inputValue && addCountry(inputValue)}
            variant="outline"
            size="sm"
            disabled={!inputValue}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        {description}
      </p>

      {/* Regional Quick Actions */}
      <RegionalQuickActions onAddRegion={addRegion} />

      {/* Helper Text */}
      {value.length === 0 && (
        <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 Start typing a country name or code (e.g., "United States" or "US")
          </p>
        </div>
      )}
    </div>
  );
}

export function GeoRestrictionsCard({ policies, setPolicies }: { policies: SessionPolicies; setPolicies: SetPolicies }) {
  // Memoize handlers to prevent unnecessary re-renders
  const handleToggle = useCallback((checked: boolean) => {
    // Track toggle in Sentry
    addSentryBreadcrumb('Geographic restrictions toggled', {
      enabled: checked,
      allowedCountries: policies.geoFencing.allowedCountries.length,
      blockedCountries: policies.geoFencing.blockedCountries.length,
    });

    setPolicies((prev) => ({
      ...prev,
      geoFencing: { ...prev.geoFencing, enabled: checked }
    }));
  }, [policies.geoFencing.allowedCountries.length, policies.geoFencing.blockedCountries.length, setPolicies]);

  const handleAllowedCountriesChange = useCallback((countries: string[]) => {
    setPolicies((prev) => ({
      ...prev,
      geoFencing: { ...prev.geoFencing, allowedCountries: countries }
    }));
  }, [setPolicies]);

  const handleBlockedCountriesChange = useCallback((countries: string[]) => {
    setPolicies((prev) => ({
      ...prev,
      geoFencing: { ...prev.geoFencing, blockedCountries: countries }
    }));
  }, [setPolicies]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <CardTitle className="text-base">Geographic Restrictions</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control access based on user location
              </p>
            </div>
          </div>
          <Switch
            checked={policies.geoFencing.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>
      {policies.geoFencing.enabled && (
        <CardContent className="space-y-6">
          <CountryInput
            label="Allowed Countries"
            value={policies.geoFencing.allowedCountries}
            onChange={handleAllowedCountriesChange}
            placeholder="Search by country name or code..."
            description="Only users from these countries can access. Leave empty to allow all except blocked."
          />
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <CountryInput
              label="Blocked Countries"
              value={policies.geoFencing.blockedCountries}
              onChange={handleBlockedCountriesChange}
              placeholder="Search by country name or code..."
              description="Users from these countries will be denied access"
            />
          </div>

          {/* Policy Summary */}
          {(policies.geoFencing.allowedCountries.length > 0 || policies.geoFencing.blockedCountries.length > 0) && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                📋 Current Policy:
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {policies.geoFencing.allowedCountries.length > 0 
                  ? `Access limited to ${policies.geoFencing.allowedCountries.length} ${policies.geoFencing.allowedCountries.length === 1 ? 'country' : 'countries'}`
                  : 'All countries allowed'}
                {policies.geoFencing.blockedCountries.length > 0 && 
                  `, with ${policies.geoFencing.blockedCountries.length} blocked`}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}