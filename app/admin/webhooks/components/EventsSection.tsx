import { memo, useMemo } from 'react';
import { Badge } from '@/components/common';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEBHOOK_EVENTS = [
  { id: "user.created", label: "User Created", category: "Users" },
  { id: "user.updated", label: "User Updated", category: "Users" },
  { id: "user.deleted", label: "User Deleted", category: "Users" },
  { id: "user.login", label: "User Login", category: "Users" },
  { id: "event.created", label: "Event Created", category: "Events" },
  { id: "event.updated", label: "Event Updated", category: "Events" },
  { id: "event.published", label: "Event Published", category: "Events" },
  { id: "event.cancelled", label: "Event Cancelled", category: "Events" },
  { id: "event.deleted", label: "Event Deleted", category: "Events" },
  { id: "media.uploaded", label: "Media Uploaded", category: "Media" },
  { id: "media.deleted", label: "Media Deleted", category: "Media" },
  { id: "media.shared", label: "Media Shared", category: "Media" },
  { id: "folder.created", label: "Folder Created", category: "Media" },
  { id: "session.created", label: "Session Created", category: "Sessions" },
  { id: "session.suspicious", label: "Suspicious Activity", category: "Sessions" },
  { id: "session.terminated", label: "Session Terminated", category: "Sessions" },
  { id: "sync.completed", label: "Sync Completed", category: "Analytics" },
  { id: "sync.failed", label: "Sync Failed", category: "Analytics" },
  { id: "notification.created", label: "Notification Created", category: "Notifications" },
  { id: "notification.read", label: "Notification Read", category: "Notifications" },
];

const EVENT_CATEGORIES = ["Users", "Events", "Media", "Sessions", "Analytics", "Notifications"];

interface EventsSectionProps {
  selectedEvents: string[];
  /* eslint-disable-next-line no-unused-vars */
  onToggleEvent: (eventId: string) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSelectAllInCategory: (categoryEventIds: string[]) => void;
}

export const EventsSection = memo(function EventsSection({
  selectedEvents,
  onToggleEvent,
  onSelectAllInCategory,
}: EventsSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Events <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-slate-500 mb-3">
        Select which events should trigger this webhook
      </p>

      <div className="space-y-3">
        {EVENT_CATEGORIES.map((category) => (
          <CategorySection
            key={category}
            category={category}
            selectedEvents={selectedEvents}
            onToggleEvent={onToggleEvent}
            onSelectAllInCategory={onSelectAllInCategory}
          />
        ))}
      </div>

      {selectedEvents.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
            {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </div>
  );
});

const CategorySection = memo(function CategorySection({
  category,
  selectedEvents,
  onToggleEvent,
  onSelectAllInCategory,
}: {
  category: string;
  selectedEvents: string[];
  /* eslint-disable-next-line no-unused-vars */
  onToggleEvent: (eventId: string) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSelectAllInCategory: (categoryEventIds: string[]) => void;
}) {
  const categoryEvents = useMemo(
    () => WEBHOOK_EVENTS.filter(e => e.category === category),
    [category]
  );

  const selectedCount = useMemo(
    () => categoryEvents.filter(e => selectedEvents.includes(e.id)).length,
    [categoryEvents, selectedEvents]
  );

  const allSelected = selectedCount === categoryEvents.length;
  const categoryEventIds = useMemo(() => categoryEvents.map(e => e.id), [categoryEvents]);

  return (
    <div className="border rounded-lg p-3 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onSelectAllInCategory(categoryEventIds)}
          className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <div className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
            allSelected
              ? "bg-blue-500 border-blue-500"
              : selectedCount > 0
              ? "bg-blue-200 border-blue-500 dark:bg-blue-800"
              : "border-slate-300 dark:border-slate-600"
          )}>
            {allSelected && <Check className="w-3 h-3 text-white" />}
            {selectedCount > 0 && !allSelected && (
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-sm" />
            )}
          </div>
          {category}
          {selectedCount > 0 && (
            <Badge variant="info" size="sm">
              {selectedCount}/{categoryEvents.length}
            </Badge>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {categoryEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => onToggleEvent(event.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors text-left",
              selectedEvents.includes(event.id)
                ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            <div className={cn(
              "w-3 h-3 rounded-sm border-2 flex items-center justify-center transition-colors",
              selectedEvents.includes(event.id)
                ? "bg-blue-500 border-blue-500"
                : "border-slate-300 dark:border-slate-600"
            )}>
              {selectedEvents.includes(event.id) && (
                <Check className="w-2 h-2 text-white" />
              )}
            </div>
            <span className="text-xs">{event.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

