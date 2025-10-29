'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { Activity, LogIn, LogOut, Shield, AlertTriangle } from 'lucide-react';
import { clientLog } from '@/lib/client-logger';

interface TimelineEvent {
  id: string;
  type: 'login' | 'logout' | 'suspicious' | 'revoked' | 'activity';
  user: string;
  timestamp: Date;
  details: string;
  location?: string;
  device?: string;
}

function getEventIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'login': return LogIn;
    case 'logout': return LogOut;
    case 'suspicious': return AlertTriangle;
    case 'revoked': return Shield;
    default: return Activity;
  }
}

function getEventColor(type: TimelineEvent['type']) {
  switch (type) {
    case 'login': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    case 'logout': return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
    case 'suspicious': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    case 'revoked': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
    default: return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function TimelineEventItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const Icon = getEventIcon(event.type);
  const colorClass = getEventColor(event.type);

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
      )}
      
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${colorClass} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                {event.details}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {event.user}
              </div>
              {event.location && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  📍 {event.location}
                </div>
              )}
              {event.device && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  💻 {event.device}
                </div>
              )}
            </div>
            
            <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {formatTimeAgo(event.timestamp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SessionTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/sessions/timeline');
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline events');
      }
      
      const data = await response.json();
      
      // Convert timestamp strings to Date objects
      const events = data.map((event: TimelineEvent) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
      
      setEvents(events);
      setLoading(false);
    } catch (error) {
      clientLog.error('Session Timeline: Failed to fetch', { error });
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Activity Timeline</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                isLast={index === events.length - 1}
              />
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No recent events
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

