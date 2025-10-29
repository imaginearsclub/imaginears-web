'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  Button, 
  Badge 
} from '@/components/common';
import { 
  Monitor, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Trash2,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import { clientLog } from '@/lib/client-logger';

interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  country: string;
  city: string | null;
  isSuspicious: boolean;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  isExpired: boolean;
  lastActivity: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface ViewSessionsModalProps {
  userId: string | null;
  onClose: () => void;
}

function getBrowser(ua: string): string {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

function getDevice(ua: string): string {
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'Mobile';
  if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablet';
  return 'Desktop';
}

function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  return {
    browser: getBrowser(ua),
    os: getOS(ua),
    device: getDevice(ua),
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function SessionCard({ 
  session, 
  onRevoke,
  isRevoking 
}: { 
  session: Session; 
  onRevoke: (_sessionId: string) => Promise<void>; // eslint-disable-line no-unused-vars
  isRevoking: boolean;
}) {
  const { browser, os, device } = parseUserAgent(session.userAgent);
  const isCurrentlyActive = session.isActive && !session.isExpired;

  return (
    <div className={`p-4 rounded-lg border-2 ${
      session.isSuspicious 
        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
        : isCurrentlyActive
        ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {isCurrentlyActive ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Expired
              </Badge>
            )}
            {session.isSuspicious && (
              <Badge variant="danger" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Suspicious
              </Badge>
            )}
            <Badge variant="default">{device}</Badge>
          </div>

          {/* Device Info */}
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-medium">
              {browser} on {os}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4" />
            <span>
              {session.city ? `${session.city}, ${session.country}` : session.country}
            </span>
          </div>

          {/* IP Address */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Globe className="w-4 h-4" />
            <span className="font-mono">{session.ipAddress}</span>
          </div>

          {/* Timestamps */}
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Created: {formatDate(session.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Last activity: {formatTimeAgo(session.lastActivity)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Expires: {formatDate(session.expiresAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isCurrentlyActive && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRevoke(session.id)}
            disabled={isRevoking}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

function SessionsList({ 
  sessions, 
  title, 
  onRevoke, 
  revokingId 
}: { 
  sessions: Session[]; 
  title: string; 
  onRevoke: (_id: string) => Promise<void>; // eslint-disable-line no-unused-vars
  revokingId: string | null;
}) {
  if (sessions.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
        {title} ({sessions.length})
      </h3>
      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onRevoke={onRevoke}
            isRevoking={revokingId === session.id}
          />
        ))}
      </div>
    </div>
  );
}

function ModalContent({
  loading,
  user,
  activeSessions,
  expiredSessions,
  onRevoke,
  revokingId,
}: {
  loading: boolean;
  user: User | null;
  activeSessions: Session[];
  expiredSessions: Session[];
  onRevoke: (_id: string) => Promise<void>; // eslint-disable-line no-unused-vars
  revokingId: string | null;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            User Sessions
          </DialogTitle>
          {user && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {user.name || 'Unknown User'} ({user.email})
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <SessionsList 
            sessions={activeSessions} 
            title="Active Sessions" 
            onRevoke={onRevoke}
            revokingId={revokingId}
          />
          <SessionsList 
            sessions={expiredSessions} 
            title="Expired Sessions" 
            onRevoke={onRevoke}
            revokingId={revokingId}
          />

          {activeSessions.length === 0 && expiredSessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                No sessions found for this user
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function ViewSessionsModal({ userId, onClose }: ViewSessionsModalProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sessions/user/${userId}`);

      if (!response.ok) {
        const errorText = await response.text();
        clientLog.error('View Sessions: API error', { 
          status: response.status, 
          statusText: response.statusText,
          errorText,
          userId 
        });
        throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUser(data.user);
      setSessions(data.sessions);
      
      clientLog.info('View Sessions: Loaded successfully', { 
        userId, 
        sessionsCount: data.sessions.length 
      });
    } catch (error) {
      clientLog.error('View Sessions: Failed to fetch', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId 
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId, fetchSessions]);

  const handleRevoke = async (sessionId: string) => {
    try {
      setRevokingId(sessionId);

      const response = await fetch(`/api/admin/sessions/revoke/${sessionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      clientLog.info('Session revoked', { sessionId, userId });
      await fetchSessions();
    } catch (error) {
      clientLog.error('View Sessions: Failed to revoke', { error, sessionId });
      alert('Failed to revoke session. Please try again.');
    } finally {
      setRevokingId(null);
    }
  };

  if (!userId) return null;

  const activeSessions = sessions.filter(s => s.isActive && !s.isExpired);
  const expiredSessions = sessions.filter(s => !s.isActive || s.isExpired);

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <ModalContent
          loading={loading}
          user={user}
          activeSessions={activeSessions}
          expiredSessions={expiredSessions}
          onRevoke={handleRevoke}
          revokingId={revokingId}
        />
      </DialogContent>
    </Dialog>
  );
}