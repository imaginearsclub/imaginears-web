'use client';

import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { AlertTriangle, Save, Check } from 'lucide-react';
import { Button, Tooltip } from '@/components/common';
import { clientLog } from '@/lib/client-logger';
import { IpRestrictionsCard } from './IpRestrictionsCard';
import { GeoRestrictionsCard } from './GeoRestrictionsCard';
import { SecurityFeaturesCard, NotificationsCard } from './PolicyCards';
import type { SessionPolicies } from './types';

interface Props {
  initialPolicies: SessionPolicies;
}

const SaveButton = memo(({ 
  onClick, 
  saving, 
  saved 
}: { 
  onClick: () => void; 
  saving: boolean; 
  saved: boolean; 
}) => {
  return (
    <Tooltip content={saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}>
      <Button 
        onClick={onClick} 
        disabled={saving}
        variant={saved ? 'success' : 'primary'}
        size="md"
        ariaLabel={saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
      >
        {saved ? (
          <Check className="w-5 h-5" />
        ) : (
          <Save className={`w-5 h-5 ${saving ? 'animate-pulse' : ''}`} />
        )}
      </Button>
    </Tooltip>
  );
});

SaveButton.displayName = 'SaveButton';

export function SessionPoliciesClient({ initialPolicies }: Props) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Track timeout for cleanup to prevent memory leak
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoize handleSave to prevent unnecessary re-renders
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Save policies to API
      const response = await fetch('/api/admin/sessions/policies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policies),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save policies');
      }

      const savedPolicies = await response.json();
      
      // Update local state with saved policies to ensure consistency
      setPolicies(savedPolicies);
      
      setSaved(true);
      
      // Clear any existing timeout before setting a new one
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
      
      // Store timeout ref for cleanup
      savedTimeoutRef.current = setTimeout(() => {
        setSaved(false);
        savedTimeoutRef.current = null;
      }, 3000);
      
      clientLog.info('Session policies saved successfully');
    } catch (error) {
      clientLog.error('Session Policies: Failed to save', { error });
      // You might want to show an error toast here
    } finally {
      setSaving(false);
    }
  }, [policies]);

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SaveButton onClick={handleSave} saving={saving} saved={saved} />
      </div>

      <IpRestrictionsCard policies={policies} setPolicies={setPolicies} />
      <GeoRestrictionsCard policies={policies} setPolicies={setPolicies} />
      <SecurityFeaturesCard policies={policies} setPolicies={setPolicies} />
      <NotificationsCard policies={policies} setPolicies={setPolicies} />

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

      <div className="flex justify-end">
        <SaveButton onClick={handleSave} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

