"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Button, 
  Label, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/common";
import { Globe } from "lucide-react";
import { toast } from "sonner";

interface TimezoneSelectorProps {
  currentTimezone: string | null;
  action: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

// Common timezones grouped by region
const TIMEZONE_OPTIONS = [
  { label: "US & Canada", value: "", disabled: true },
  { label: "Eastern Time (New York)", value: "America/New_York" },
  { label: "Central Time (Chicago)", value: "America/Chicago" },
  { label: "Mountain Time (Denver)", value: "America/Denver" },
  { label: "Pacific Time (Los Angeles)", value: "America/Los_Angeles" },
  { label: "Alaska Time", value: "America/Anchorage" },
  { label: "Hawaii Time", value: "Pacific/Honolulu" },
  
  { label: "Europe", value: "", disabled: true },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris (CET/CEST)", value: "Europe/Paris" },
  { label: "Berlin (CET/CEST)", value: "Europe/Berlin" },
  { label: "Athens (EET/EEST)", value: "Europe/Athens" },
  { label: "Moscow (MSK)", value: "Europe/Moscow" },
  
  { label: "Asia & Pacific", value: "", disabled: true },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "India (IST)", value: "Asia/Kolkata" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Hong Kong (HKT)", value: "Asia/Hong_Kong" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Sydney (AEST/AEDT)", value: "Australia/Sydney" },
  { label: "Auckland (NZST/NZDT)", value: "Pacific/Auckland" },
  
  { label: "Americas", value: "", disabled: true },
  { label: "Mexico City", value: "America/Mexico_City" },
  { label: "São Paulo", value: "America/Sao_Paulo" },
  { label: "Buenos Aires", value: "America/Argentina/Buenos_Aires" },
  
  { label: "Other", value: "", disabled: true },
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
];

// Get browser's detected timezone
const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch (error) {
    return "America/New_York";
  }
};

export function TimezoneSelector({ currentTimezone, action }: TimezoneSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [timezone, setTimezone] = useState(currentTimezone || "America/New_York");
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);

  useEffect(() => {
    // Detect browser timezone on mount
    const detected = getBrowserTimezone();
    setDetectedTimezone(detected);
    
    // If no timezone is set, show the detected one
    if (!currentTimezone) {
      setTimezone(detected);
    }
  }, [currentTimezone]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await action(formData);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleUseDetected = () => {
    if (detectedTimezone) {
      setTimezone(detectedTimezone);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="timezone" value={timezone} />
      
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select
          value={timezone}
          onValueChange={setTimezone}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((option, index) => 
              option.disabled ? (
                <div 
                  key={index}
                  className="px-2 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50"
                >
                  {option.label}
                </div>
              ) : (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        
        {detectedTimezone && detectedTimezone !== timezone && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Globe className="w-3 h-3" />
            <span>
              Detected: {detectedTimezone}
            </span>
            <button
              type="button"
              onClick={handleUseDetected}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Use detected
            </button>
          </div>
        )}
        
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Event times will be displayed in your selected timezone
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={isPending || timezone === currentTimezone}
        className="w-full sm:w-auto"
      >
        {isPending ? "Saving..." : "Save Timezone"}
      </Button>
    </form>
  );
}

