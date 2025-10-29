import { Card, CardContent, CardHeader, CardTitle, Input, Switch, Badge } from '@/components/common';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import type { SessionPolicies, SetPolicies } from './types';
import { useState } from 'react';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register English locale for country names
countries.registerLocale(enLocale);

function validateCountryCode(code: string): boolean {
  // Use i18n-iso-countries for comprehensive validation
  return countries.isValid(code);
}

function getCountryName(code: string): string | null {
  return countries.getName(code, 'en', { select: 'official' }) || null;
}

// Get all country codes and names for autocomplete (available for future dropdown enhancement)
// function getAllCountries(): Array<{ code: string; name: string }> {
//   const countryNames = countries.getNames('en', { select: 'official' });
//   return Object.entries(countryNames).map(([code, name]) => ({
//     code,
//     name: name as string,
//   })).sort((a, b) => a.name.localeCompare(b.name));
// }

// Common countries for quick access
const COMMON_COUNTRY_CODES = ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'JP', 'CN', 'IN', 'BR', 'MX'];

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
  const [inputValue, setInputValue] = useState(value.join(', '));
  const [validationState, setValidationState] = useState<'valid' | 'invalid' | 'idle'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    
    const countries = newValue.split(',').map(s => s.trim()).filter(Boolean);
    
    if (countries.length === 0) {
      setValidationState('idle');
      onChange([]);
      return;
    }
    
    const allValid = countries.every(validateCountryCode);
    setValidationState(allValid ? 'valid' : 'invalid');
    
    if (allValid) {
      onChange(countries);
    }
  };

  const validCountries = inputValue.split(',').map(s => s.trim()).filter(c => validateCountryCode(c));

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
                Invalid codes
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
      {validCountries.length > 0 && validationState === 'valid' && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {validCountries.map((code) => {
            const name = getCountryName(code);
            return (
              <Badge key={code} variant="default" size="sm">
                {code}
                {name && <span className="ml-1 text-xs opacity-75">({name})</span>}
              </Badge>
            );
          })}
        </div>
      )}
      {validationState === 'invalid' && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Please enter valid 2-letter ISO country codes (e.g., US, GB, CA)
        </p>
      )}
      {validationState === 'idle' && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Common codes: {COMMON_COUNTRY_CODES.join(', ')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            All 249 ISO 3166-1 country codes supported
          </p>
        </div>
      )}
    </div>
  );
}

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
          <CountryInput
            label="Allowed Countries (comma-separated country codes)"
            value={policies.geoFencing.allowedCountries}
            onChange={(countries) => setPolicies((prev) => ({
              ...prev,
              geoFencing: { ...prev.geoFencing, allowedCountries: countries }
            }))}
            placeholder="e.g., US, CA, GB, DE"
            description="Leave empty to allow all countries except blocked ones"
          />
          <CountryInput
            label="Blocked Countries (comma-separated country codes)"
            value={policies.geoFencing.blockedCountries}
            onChange={(countries) => setPolicies((prev) => ({
              ...prev,
              geoFencing: { ...prev.geoFencing, blockedCountries: countries }
            }))}
            placeholder="e.g., CN, RU, KP"
            description="Users from these countries will be blocked"
          />
        </CardContent>
      )}
    </Card>
  );
}

