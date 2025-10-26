"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, Spinner } from "@/components/common";
import { Save, RefreshCw } from "lucide-react";
import { toast } from "@/components/common";

interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  securityAlerts: boolean;
  eventReminders: boolean;
  playerAlerts: boolean;
  sessionAlerts: boolean;
  systemAnnouncements: boolean;
  digestEnabled: boolean;
  digestFrequency: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export function NotificationPreferencesForm() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("[NotificationPreferences] Fetch error:", error);
      toast.error("Failed to load preferences", {
        message: "Please try refreshing the page",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Preferences saved", {
          message: "Your notification settings have been updated",
        });
      } else {
        throw new Error("Failed to save preferences");
      }
    } catch (error) {
      console.error("[NotificationPreferences] Save error:", error);
      toast.error("Failed to save preferences", {
        message: "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Delivery Channels */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Delivery Channels
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Choose how you want to receive notifications
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <Label htmlFor="inAppEnabled">In-App Notifications</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Show notifications in the notification center
              </p>
            </div>
            <Switch
              id="inAppEnabled"
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, inAppEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <Label htmlFor="emailEnabled">Email Notifications</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Send notifications to your email address
              </p>
            </div>
            <Switch
              id="emailEnabled"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-50">
            <div>
              <Label htmlFor="pushEnabled">Browser Push Notifications</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Coming soon • Desktop push notifications
              </p>
            </div>
            <Switch
              id="pushEnabled"
              checked={preferences.pushEnabled}
              disabled
            />
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Notification Categories
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Select which types of notifications you want to receive
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <Label htmlFor="securityAlerts">Security Alerts</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                New device logins, suspicious activity
              </p>
            </div>
            <Switch
              id="securityAlerts"
              checked={preferences.securityAlerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, securityAlerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <Label htmlFor="eventReminders">Event Reminders</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Upcoming events and activities
              </p>
            </div>
            <Switch
              id="eventReminders"
              checked={preferences.eventReminders}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, eventReminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <Label htmlFor="playerAlerts">Player Alerts</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Player joins and leaves (admin only)
              </p>
            </div>
            <Switch
              id="playerAlerts"
              checked={preferences.playerAlerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, playerAlerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <Label htmlFor="sessionAlerts">Session Alerts</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Session warnings and expiration notices
              </p>
            </div>
            <Switch
              id="sessionAlerts"
              checked={preferences.sessionAlerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, sessionAlerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <Label htmlFor="systemAnnouncements">System Announcements</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Maintenance, updates, and system messages
              </p>
            </div>
            <Switch
              id="systemAnnouncements"
              checked={preferences.systemAnnouncements}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, systemAnnouncements: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* Delivery Timing */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Delivery Timing
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Control when you receive notifications
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex-1">
              <Label htmlFor="digestEnabled">Email Digest</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Bundle notifications into a single email
              </p>
            </div>
            <Switch
              id="digestEnabled"
              checked={preferences.digestEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, digestEnabled: checked })
              }
            />
          </div>

          {preferences.digestEnabled && (
            <div className="pl-4 space-y-2">
              <Label htmlFor="digestFrequency">Digest Frequency</Label>
              <Select
                value={preferences.digestFrequency}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, digestFrequency: value })
                }
              >
                <SelectTrigger id="digestFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex-1">
              <Label htmlFor="quietHoursEnabled">Quiet Hours</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mute notifications during specific hours
              </p>
            </div>
            <Switch
              id="quietHoursEnabled"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, quietHoursEnabled: checked })
              }
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="pl-4 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quietHoursStart">Start Time</Label>
                <Input
                  id="quietHoursStart"
                  type="time"
                  value={preferences.quietHoursStart || ""}
                  onChange={(e) =>
                    setPreferences({ ...preferences, quietHoursStart: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="quietHoursEnd">End Time</Label>
                <Input
                  id="quietHoursEnd"
                  type="time"
                  value={preferences.quietHoursEnd || ""}
                  onChange={(e) =>
                    setPreferences({ ...preferences, quietHoursEnd: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Additional Settings
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Customize notification behavior
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <Label htmlFor="soundEnabled">Notification Sound</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Play sound when notifications arrive
              </p>
            </div>
            <Switch
              id="soundEnabled"
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, soundEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 opacity-50">
            <div>
              <Label htmlFor="desktopNotifications">Desktop Notifications</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Coming soon • Show browser notifications
              </p>
            </div>
            <Switch
              id="desktopNotifications"
              checked={preferences.desktopNotifications}
              disabled
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={saving}
          loadingText="Saving..."
          leftIcon={<Save />}
          ariaLabel="Save notification preferences"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

