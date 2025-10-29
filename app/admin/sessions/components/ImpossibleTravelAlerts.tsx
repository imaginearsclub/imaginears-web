'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/common';
import { Plane, AlertTriangle, MapPin, Clock, User, Check, X } from 'lucide-react';
import { clientLog } from '@/lib/client-logger';

interface ImpossibleTravelAlert {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  previousLocation: {
    city: string;
    country: string;
    ip: string;
  };
  currentLocation: {
    city: string;
    country: string;
    ip: string;
  };
  distance: number; // km
  timeDiff: number; // hours
  requiredSpeed: number; // km/h
  timestamp: Date;
  status: 'pending' | 'dismissed' | 'blocked';
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function useAlertManagement() {
  const [alerts, setAlerts] = useState<ImpossibleTravelAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const response = await fetch('/api/admin/sessions/impossible-travel');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      } catch (error) {
        clientLog.error('Impossible Travel: Failed to load alerts', { error });
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (alertId: string) => {
    setProcessing(alertId);
    try {
      const response = await fetch(`/api/admin/sessions/impossible-travel/${alertId}/dismiss`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert =>
          alert.id === alertId ? { ...alert, status: 'dismissed' as const } : alert
        ));
        clientLog.info('Impossible Travel: Alert dismissed', { alertId });
      }
    } catch (error) {
      clientLog.error('Impossible Travel: Failed to dismiss alert', { error, alertId });
    } finally {
      setProcessing(null);
    }
  };

  const handleBlock = async (alertId: string) => {
    if (!confirm('Block this user\'s session and require re-authentication?')) return;
    
    setProcessing(alertId);
    try {
      const response = await fetch(`/api/admin/sessions/impossible-travel/${alertId}/block`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert =>
          alert.id === alertId ? { ...alert, status: 'blocked' as const } : alert
        ));
        clientLog.warn('Impossible Travel: User session blocked', { alertId });
      }
    } catch (error) {
      clientLog.error('Impossible Travel: Failed to block session', { error, alertId });
    } finally {
      setProcessing(null);
    }
  };

  return { alerts, loading, processing, handleDismiss, handleBlock };
}

function AlertCard({ 
  alert, 
  processing, 
  onDismiss, 
  onBlock 
}: { 
  alert: ImpossibleTravelAlert; 
  processing: boolean;
  onDismiss: () => void;
  onBlock: () => void;
}) {
  const isCritical = alert.requiredSpeed > 15000;
  
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isCritical
          ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
          : 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          isCritical
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
        }`}>
          <Plane className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {alert.userName || alert.userEmail}
            </span>
            <Badge variant={isCritical ? 'danger' : 'warning'} size="sm">
              {alert.requiredSpeed.toLocaleString()} km/h required
            </Badge>
          </div>

          <div className="space-y-1.5 text-sm mb-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>From: {alert.previousLocation.city}, {alert.previousLocation.country}</span>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {alert.previousLocation.ip}
              </code>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>To: {alert.currentLocation.city}, {alert.currentLocation.country}</span>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {alert.currentLocation.ip}
              </code>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{alert.distance.toLocaleString()}km in {alert.timeDiff.toFixed(1)}h</span>
              <span className="text-xs">• {formatTimeAgo(alert.timestamp)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onDismiss} disabled={processing}>
              <X className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
            <Button size="sm" variant="danger" onClick={onBlock} disabled={processing}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              Block Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImpossibleTravelAlerts() {
  const { alerts, loading, processing, handleDismiss, handleBlock } = useAlertManagement();
  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const criticalAlerts = pendingAlerts.filter(a => a.requiredSpeed > 15000);

  return (
    <Card className={criticalAlerts.length > 0 ? 'border-2 border-red-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            <CardTitle className="text-base">Impossible Travel Detection</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {criticalAlerts.length > 0 && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-bold">{criticalAlerts.length} Critical</span>
              </div>
            )}
            <Badge 
              variant={pendingAlerts.length > 0 ? 'danger' : 'success'} 
              size="sm"
            >
              {pendingAlerts.length} Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : pendingAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <div className="font-semibold text-slate-900 dark:text-white">All Clear</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              No impossible travel detected
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                processing={processing === alert.id}
                onDismiss={() => handleDismiss(alert.id)}
                onBlock={() => handleBlock(alert.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}