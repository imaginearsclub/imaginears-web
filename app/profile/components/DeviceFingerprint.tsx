'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { Fingerprint, Shield, Check, AlertTriangle } from 'lucide-react';

interface FingerprintData {
  fingerprint: string;
  confidence: number;
  signals: {
    canvas: string;
    audio: string;
    webgl: string;
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    };
    hardware: {
      cores: number;
      memory: number;
      touchSupport: boolean;
    };
    browser: {
      plugins: string[];
      languages: readonly string[] | string[];
      timezone: string;
      platform: string;
    };
    fonts: string[];
  };
}

export function DeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateFingerprint() {
      try {
        // Import fingerprinting functions dynamically
        const {
          generateCanvasFingerprint,
          generateAudioFingerprint,
          generateWebGLFingerprint,
          getScreenInfo,
          getHardwareInfo,
          getBrowserInfo,
          detectFonts,
          hashString
        } = await import('@/lib/session-fingerprint');

        // Generate all signals
        const signals = {
          canvas: generateCanvasFingerprint(),
          audio: await generateAudioFingerprint(),
          webgl: generateWebGLFingerprint(),
          screen: getScreenInfo(),
          hardware: getHardwareInfo(),
          browser: getBrowserInfo(),
          fonts: detectFonts(),
        };

        // Calculate confidence
        let confidence = 0;
        if (signals.canvas && signals.canvas.length > 100) confidence += 30;
        if (signals.audio && signals.audio !== 'timeout') confidence += 20;
        if (signals.webgl && signals.webgl.includes('|')) confidence += 20;
        if (signals.screen.width > 0) confidence += 10;
        if (signals.hardware.cores > 0) confidence += 10;
        if (signals.fonts.length > 0) confidence += 10;

        // Hash combined signals
        const combined = JSON.stringify(signals);
        const hash = await hashString(combined);

        setFingerprint({
          fingerprint: hash,
          confidence,
          signals,
        });
      } catch (err) {
        console.error('Fingerprint generation error:', err);
        setError('Failed to generate device fingerprint');
      } finally {
        setLoading(false);
      }
    }

    generateFingerprint();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Fingerprint className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Generating device fingerprint...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !fingerprint) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <div className="text-sm">{error || 'Unknown error'}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = 
    fingerprint.confidence >= 80 ? 'text-green-600' :
    fingerprint.confidence >= 60 ? 'text-blue-600' :
    fingerprint.confidence >= 40 ? 'text-yellow-600' :
    'text-red-600';

  const confidenceBgColor = 
    fingerprint.confidence >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
    fingerprint.confidence >= 60 ? 'bg-blue-100 dark:bg-blue-900/30' :
    fingerprint.confidence >= 40 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
    'bg-red-100 dark:bg-red-900/30';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4" />
          <CardTitle className="text-base">Device Fingerprint</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className={`p-4 rounded-lg ${confidenceBgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm font-semibold ${confidenceColor}`}>
              Confidence Score
            </div>
            <div className={`text-2xl font-bold ${confidenceColor}`}>
              {fingerprint.confidence}%
            </div>
          </div>
          <div className="w-full h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${confidenceColor.replace('text-', 'bg-')}`}
              style={{ width: `${fingerprint.confidence}%` }}
            />
          </div>
        </div>

        {/* Fingerprint Hash */}
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-white mb-2">
            Unique Identifier
          </div>
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs break-all text-slate-700 dark:text-slate-300">
            {fingerprint.fingerprint}
          </div>
        </div>

        {/* Signals Summary */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-900 dark:text-white mb-3">
            Detection Methods
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <SignalIndicator
              label="Canvas"
              detected={fingerprint.signals.canvas.length > 100}
            />
            <SignalIndicator
              label="Audio"
              detected={fingerprint.signals.audio !== '' && fingerprint.signals.audio !== 'timeout'}
            />
            <SignalIndicator
              label="WebGL"
              detected={fingerprint.signals.webgl.includes('|')}
            />
            <SignalIndicator
              label="Screen"
              detected={fingerprint.signals.screen.width > 0}
            />
            <SignalIndicator
              label="Hardware"
              detected={fingerprint.signals.hardware.cores > 0}
            />
            <SignalIndicator
              label="Fonts"
              detected={fingerprint.signals.fonts.length > 0}
            />
          </div>
        </div>

        {/* Device Info Summary */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div>
              <span className="font-medium">Screen:</span>{' '}
              {fingerprint.signals.screen.width}×{fingerprint.signals.screen.height} @ {fingerprint.signals.screen.colorDepth}bit
            </div>
            <div>
              <span className="font-medium">Hardware:</span>{' '}
              {fingerprint.signals.hardware.cores} cores, {fingerprint.signals.hardware.memory || 'N/A'}GB RAM
            </div>
            <div>
              <span className="font-medium">Platform:</span>{' '}
              {fingerprint.signals.browser.platform}
            </div>
            <div>
              <span className="font-medium">Timezone:</span>{' '}
              {fingerprint.signals.browser.timezone}
            </div>
            <div>
              <span className="font-medium">Fonts:</span>{' '}
              {fingerprint.signals.fonts.length} detected
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            This fingerprint uniquely identifies your device for enhanced security. 
            It helps detect unauthorized access and session hijacking attempts.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SignalIndicator({ label, detected }: { label: string; detected: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      {detected ? (
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-slate-400" />
      )}
      <span className={`text-xs font-medium ${
        detected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
      }`}>
        {label}
      </span>
    </div>
  );
}

