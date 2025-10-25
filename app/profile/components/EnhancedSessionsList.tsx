"use client";

import { useState } from "react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from "@/components/common";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Clock,
  Shield,
  Edit2,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface EnhancedSession {
  id: string;
  token: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  trustLevel: number;
  isSuspicious: boolean;
  lastActivityAt: Date;
  isRememberMe: boolean;
  loginMethod: string | null;
  createdAt: Date;
  expiresAt: Date;
}

interface EnhancedSessionsListProps {
  sessions: EnhancedSession[];
  currentSessionToken?: string | undefined;
}

function getDeviceIcon(deviceType: string | null) {
  if (!deviceType) return <Monitor className="w-5 h-5" />;
  
  switch (deviceType.toLowerCase()) {
    case "mobile":
      return <Smartphone className="w-5 h-5" />;
    case "tablet":
      return <Tablet className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
}

function getTrustBadge(trustLevel: number) {
  if (trustLevel >= 2) {
    return (
      <Badge variant="success" size="sm" className="gap-1">
        <Shield className="w-3 h-3" />
        Trusted
      </Badge>
    );
  }
  if (trustLevel >= 1) {
    return (
      <Badge variant="default" size="sm" className="gap-1">
        <Shield className="w-3 h-3" />
        Recognized
      </Badge>
    );
  }
  return (
    <Badge variant="default" size="sm" className="gap-1">
      <Shield className="w-3 h-3" />
      New
    </Badge>
  );
}

export function EnhancedSessionsList({ sessions, currentSessionToken }: EnhancedSessionsListProps) {
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<EnhancedSession | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevokeSession = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to revoke session");
      }
      
      toast.success("Session revoked successfully");
      window.location.reload(); // Reload to update the list
    } catch (error) {
      console.error("Failed to revoke session:", error);
      toast.error("Failed to revoke session");
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    setIsRevoking(true);
    
    try {
      const response = await fetch("/api/user/sessions", {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to revoke sessions");
      }
      
      const data = await response.json();
      toast.success(`${data.count} session(s) revoked successfully`);
      window.location.reload();
    } catch (error) {
      console.error("Failed to revoke sessions:", error);
      toast.error("Failed to revoke sessions");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRenameSession = async () => {
    if (!editingSession || !newDeviceName.trim()) return;
    
    try {
      const response = await fetch(`/api/user/sessions/${editingSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName: newDeviceName.trim() }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to rename session");
      }
      
      toast.success("Device name updated");
      setEditingSession(null);
      setNewDeviceName("");
      window.location.reload();
    } catch (error) {
      console.error("Failed to rename session:", error);
      toast.error("Failed to rename session");
    }
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
    <div className="space-y-4">
      {/* Revoke All Button */}
      {sessions.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={handleRevokeAllOthers}
            disabled={isRevoking}
            className="gap-2"
          >
            {isRevoking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Revoke All Other Sessions
          </Button>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const isCurrentSession = session.token === currentSessionToken;
          const isExpired = new Date(session.expiresAt) < new Date();
          const deviceName = session.deviceName || `${session.browser} on ${session.os}`;
          const location = session.city && session.country 
            ? `${session.city}, ${session.country}` 
            : session.country || "Unknown location";
          
          return (
            <div
              key={session.id}
              className={cn(
                "flex items-start justify-between p-4 rounded-xl border-2 transition-all duration-200",
                isCurrentSession
                  ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                  : session.isSuspicious
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
                isExpired && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg",
                  isCurrentSession
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : session.isSuspicious
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}>
                  {getDeviceIcon(session.deviceType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {deviceName}
                    </h4>
                    {isCurrentSession && (
                      <Badge variant="primary" size="sm" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Current
                      </Badge>
                    )}
                    {session.isSuspicious && (
                      <Badge variant="danger" size="sm" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Suspicious
                      </Badge>
                    )}
                    {getTrustBadge(session.trustLevel)}
                    {session.isRememberMe && (
                      <Badge variant="info" size="sm">
                        Remember Me
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Last active {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs">
                      Started: {format(new Date(session.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {session.loginMethod && (
                      <p className="text-xs">
                        Login method: {session.loginMethod}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingSession(session);
                    setNewDeviceName(deviceName);
                  }}
                  className="gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Rename
                </Button>
                
                {!isCurrentSession && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={deletingSessionId === session.id}
                    className="gap-1"
                  >
                    {deletingSessionId === session.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Security Tip:</strong> Regularly review your active sessions. If you see any unfamiliar devices or locations, revoke them immediately and change your password.
        </p>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g., John's iPhone"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Choose a friendly name to easily identify this device
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditingSession(null)}>
                Cancel
              </Button>
              <Button onClick={handleRenameSession} disabled={!newDeviceName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

