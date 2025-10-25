"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/common";
import { Cookie, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookieConsent", JSON.stringify(prefs));
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    
    // Trigger event for analytics/marketing scripts to react
    window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: prefs }));
    
    setIsVisible(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const acceptNecessary = () => {
    savePreferences(DEFAULT_PREFERENCES);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={() => !showSettings && setIsVisible(false)}
      />

      {/* Banner */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 pointer-events-auto",
        "md:bottom-4 md:left-4 md:right-auto md:max-w-md",
        "transform transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}>
        <div className={cn(
          "bg-white dark:bg-slate-900",
          "border-t-4 md:border-t-0 md:border-l-4 border-blue-500",
          "md:rounded-2xl shadow-2xl",
          "p-6 space-y-4"
        )}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Cookie Preferences
              </h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showSettings ? (
            <>
              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies.
              </p>

              {/* Links */}
              <div className="flex flex-wrap gap-2 text-xs">
                <Link 
                  href="/privacy" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Privacy Policy
                </Link>
                <span className="text-slate-400">•</span>
                <Link 
                  href="/terms" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Terms of Service
                </Link>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={acceptAll}
                  className="flex-1"
                >
                  Accept All
                </Button>
                <Button
                  onClick={acceptNecessary}
                  variant="outline"
                  className="flex-1"
                >
                  Necessary Only
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="sm:w-auto"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Settings View */}
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Customize your cookie preferences below:
                </p>

                {/* Necessary Cookies */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      Necessary Cookies
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Required for the website to function. Cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      Analytics Cookies
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Help us understand how visitors use our website.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      Marketing Cookies
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Used to track visitors across websites for advertising.
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={saveCustomPreferences}
                  className="flex-1"
                >
                  Save Preferences
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

