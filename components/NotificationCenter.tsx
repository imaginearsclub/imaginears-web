"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, CheckCheck, Archive, ExternalLink, Loader2 } from "lucide-react";
import { Button, Badge } from "./common";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./common/DropdownMenu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  category: string;
  actionUrl?: string | null;
  actionText?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=20");
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("[NotificationCenter] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("[NotificationCenter] Mark as read error:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("[NotificationCenter] Mark all as read error:", error);
    }
  };

  // Archive notification
  const archiveNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/archive`, {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // If it was unread, decrease count
        const notification = notifications.find((n) => n.id === id);
        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("[NotificationCenter] Archive error:", error);
    }
  };

  // Get notification type variant
  const getTypeVariant = (type: string): "default" | "success" | "warning" | "danger" | "info" => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
      case "security":
        return "danger";
      case "info":
      case "event":
        return "info";
      default:
        return "default";
    }
  };

  // Get priority indicator
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-4 border-l-red-500";
      case "high":
        return "border-l-4 border-l-orange-500";
      case "normal":
        return "border-l-2 border-l-blue-500";
      case "low":
        return "border-l-2 border-l-slate-300 dark:border-l-slate-700";
      default:
        return "";
    }
  };

  return (
    <DropdownMenu 
      open={open} 
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        // Fetch latest notifications when opening
        if (isOpen) {
          fetchNotifications();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="md"
          className="relative"
          ariaLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          data-tour="notification-bell"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-[90vw] md:w-[420px] p-0 max-h-[600px] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                leftIcon={<CheckCheck />}
                ariaLabel="Mark all as read"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                No notifications
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20",
                    getPriorityColor(notification.priority)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Badge 
                      variant={getTypeVariant(notification.type)} 
                      size="sm"
                      className="mt-0.5"
                    >
                      {notification.type}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm font-medium text-slate-900 dark:text-white",
                          !notification.isRead && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      {notification.actionUrl && notification.actionText && (
                        <a
                          href={notification.actionUrl}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mt-2"
                          onClick={() => {
                            markAsRead(notification.id);
                            setOpen(false);
                          }}
                        >
                          {notification.actionText}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => archiveNotification(notification.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3">
            <a
              href="/profile#notifications"
              className="block text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications & settings
            </a>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

