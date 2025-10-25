"use client";

import { useState, useTransition } from "react";
import { Button, Badge } from "@/components/common";
import { Monitor, Smartphone, Tablet, Trash2, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Session {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
}

interface SessionsListProps {
  sessions: Session[];
  currentSessionToken?: string;
  deleteAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Monitor className="w-5 h-5" />;
  
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return <Smartphone className="w-5 h-5" />;
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return <Tablet className="w-5 h-5" />;
  }
  return <Monitor className="w-5 h-5" />;
}

function getDeviceInfo(userAgent: string | null) {
  if (!userAgent) return { browser: "Unknown", os: "Unknown" };
  
  // Simple parsing - could be enhanced with a proper UA parser library
  let browser = "Unknown";
  let os = "Unknown";
  
  // Browser detection
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";
  
  // OS detection
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  return { browser, os };
}

export function SessionsList({ sessions, currentSessionToken, deleteAction }: SessionsListProps) {
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (sessionId: string) => {
    setDeletingSessionId(sessionId);

    const formData = new FormData();
    formData.append("sessionId", sessionId);

    startTransition(async () => {
      try {
        await deleteAction(formData);
      } catch (error) {
        console.error("Failed to delete session:", error);
      } finally {
        setDeletingSessionId(null);
      }
    });
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No active sessions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isCurrentSession = session.token === currentSessionToken;
        const deviceInfo = getDeviceInfo(session.userAgent);
        const isExpired = new Date(session.expiresAt) < new Date();
        
        return (
          <div
            key={session.id}
            className={cn(
              "flex items-start justify-between p-4 rounded-xl border-2 transition-all duration-200",
              isCurrentSession
                ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
              isExpired && "opacity-60"
            )}
          >
            <div className="flex items-start gap-3 flex-1">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg",
                isCurrentSession
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              )}>
                {getDeviceIcon(session.userAgent)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {deviceInfo.browser} on {deviceInfo.os}
                  </h4>
                  {isCurrentSession && (
                    <Badge variant="primary" size="sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Current
                    </Badge>
                  )}
                  {isExpired && (
                    <Badge variant="default" size="sm">
                      Expired
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                  {session.ipAddress && (
                    <p>IP: <span className="font-mono text-xs">{session.ipAddress}</span></p>
                  )}
                  <p>
                    Started: {format(new Date(session.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <p>
                    Expires: {format(new Date(session.expiresAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            {!isCurrentSession && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(session.id)}
                disabled={isPending && deletingSessionId === session.id}
              >
                {isPending && deletingSessionId === session.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Revoke
                  </>
                )}
              </Button>
            )}
          </div>
        );
      })}

      <div className="p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Note:</strong> Revoking a session will log out that device immediately. Your current session cannot be revoked from this page.
        </p>
      </div>
    </div>
  );
}

