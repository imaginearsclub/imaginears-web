'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/common';
import { Shield, Lock, Zap, CheckCircle } from 'lucide-react';
import { clientLog } from '@/lib/client-logger';

interface Threat {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  affectedUsers: number;
  detectedAt: Date;
  status: 'active' | 'investigating' | 'resolved';
}

function getSeverityColor(severity: Threat['severity']) {
  switch (severity) {
    case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-500';
    case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-500';
    case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-500';
    case 'low': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500';
  }
}

function getSeverityIcon(severity: Threat['severity']) {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ThreatCard({ 
  threat, 
  onAction 
}: { 
  threat: Threat; 
  onAction: (_threatId: string, _action: 'block' | 'investigate' | 'resolve') => void; // eslint-disable-line no-unused-vars
}) {
  return (
    <div className={`p-4 rounded-lg border-2 ${getSeverityColor(threat.severity)}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getSeverityIcon(threat.severity)}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-sm">{threat.type}</div>
              <div className="text-sm mt-1">{threat.description}</div>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span>{threat.affectedUsers} user{threat.affectedUsers !== 1 ? 's' : ''} affected</span>
                <span>•</span>
                <span>{formatTimeAgo(threat.detectedAt)}</span>
                {threat.status === 'investigating' && (
                  <>
                    <span>•</span>
                    <span className="font-semibold">🔍 Investigating</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {threat.status === 'active' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onAction(threat.id, 'investigate')}>
                  <Shield className="w-3 h-3 mr-1" />
                  Investigate
                </Button>
                {threat.severity === 'critical' && (
                  <Button size="sm" variant="danger" onClick={() => onAction(threat.id, 'block')}>
                    <Lock className="w-3 h-3 mr-1" />
                    Block Now
                  </Button>
                )}
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => onAction(threat.id, 'resolve')}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Resolve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThreatDetectionPanel() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreats = async () => {
    try {
      const response = await fetch('/api/admin/sessions/threats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch threats');
      }
      
      const data = await response.json();
      
      // Convert timestamp strings to Date objects
      const threats = data.map((threat: Threat) => ({
        ...threat,
        detectedAt: new Date(threat.detectedAt),
      }));
      
      setThreats(threats);
      setLoading(false);
    } catch (error) {
      clientLog.error('Threats: Failed to fetch', { error });
      setLoading(false);
    }
  };

  const handleQuickAction = async (threatId: string, action: 'block' | 'investigate' | 'resolve') => {
    try {
      const response = await fetch('/api/admin/sessions/threats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threatId, action }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to handle threat action');
      }
      
      clientLog.info(`Threat ${action}`, { threatId, action });
      
      // Update local state
      if (action === 'resolve') {
        setThreats(prev => prev.map(t => 
          t.id === threatId ? { ...t, status: 'resolved' as const } : t
        ));
      } else if (action === 'investigate') {
        setThreats(prev => prev.map(t => 
          t.id === threatId ? { ...t, status: 'investigating' as const } : t
        ));
      }
    } catch (error) {
      clientLog.error('Threats: Failed to handle action', { error, threatId, action });
    }
  };

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const activeThreats = threats.filter(t => t.status === 'active');
  const criticalCount = activeThreats.filter(t => t.severity === 'critical').length;

  return (
    <Card className={criticalCount > 0 ? 'border-2 border-red-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle className="text-base">Threat Detection</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <Zap className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-bold">{criticalCount} Critical</span>
              </div>
            )}
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {activeThreats.length} Active
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {threats.filter(t => t.status !== 'resolved').map(threat => (
              <ThreatCard key={threat.id} threat={threat} onAction={handleQuickAction} />
            ))}
            {threats.filter(t => t.status !== 'resolved').length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <div className="font-semibold text-slate-900 dark:text-white">All Clear</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">No active threats detected</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}