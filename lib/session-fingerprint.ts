/**
 * Advanced Session Fingerprinting
 * 
 * Creates a unique fingerprint for each device using multiple signals:
 * - Canvas fingerprinting
 * - Audio context fingerprinting
 * - WebGL fingerprinting
 * - Screen & hardware details
 * - Browser capabilities
 */

export interface DeviceFingerprint {
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
    languages: string[];
    timezone: string;
    platform: string;
    doNotTrack: string | null;
  };
  fonts: string[];
}

export interface FingerprintResult {
  fingerprint: string; // SHA-256 hash of all signals
  confidence: number; // 0-100, how unique/reliable the fingerprint is
  signals: DeviceFingerprint;
}

/**
 * Generate canvas fingerprint (client-side)
 * Returns base64 data URL of canvas rendering
 */
export function generateCanvasFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    // Draw text with various styles
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas Fingerprint 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas Fingerprint 🔒', 4, 17);
    
    return canvas.toDataURL();
  } catch (error) {
    console.error('[Fingerprint] Canvas error:', error);
    return '';
  }
}

/**
 * Generate audio context fingerprint (client-side)
 * Returns hash of audio signal processing
 */
export function generateAudioFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return Promise.resolve('');
  
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve('');
        return;
      }
      
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
      
      gainNode.gain.value = 0; // Mute
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);
      
      scriptProcessor.onaudioprocess = (event) => {
        const output = event.outputBuffer.getChannelData(0);
        const hash = Array.from(output.slice(0, 100))
          .reduce((acc, val) => acc + Math.abs(val), 0)
          .toString(36);
        
        oscillator.disconnect();
        scriptProcessor.disconnect();
        context.close();
        
        resolve(hash);
      };
      
      oscillator.start(0);
      
      // Timeout after 100ms
      setTimeout(() => {
        try {
          oscillator.stop();
        } catch (e) {}
        resolve('timeout');
      }, 100);
    } catch (error) {
      console.error('[Fingerprint] Audio error:', error);
      resolve('');
    }
  });
}

/**
 * Generate WebGL fingerprint (client-side)
 * Returns renderer and vendor information
 */
export function generateWebGLFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) return '';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return `${vendor}|${renderer}`;
  } catch (error) {
    console.error('[Fingerprint] WebGL error:', error);
    return '';
  }
}

/**
 * Get screen information (client-side)
 */
export function getScreenInfo() {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      colorDepth: 0,
      pixelRatio: 1,
    };
  }
  
  return {
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Get hardware information (client-side)
 */
export function getHardwareInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      cores: 0,
      memory: 0,
      touchSupport: false,
    };
  }
  
  return {
    cores: (navigator as any).hardwareConcurrency || 0,
    memory: (navigator as any).deviceMemory || 0,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}

/**
 * Get browser information (client-side)
 */
export function getBrowserInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      plugins: [],
      languages: [],
      timezone: '',
      platform: '',
      doNotTrack: null,
    };
  }
  
  return {
    plugins: Array.from(navigator.plugins || []).map(p => p.name).sort(),
    languages: navigator.languages || [navigator.language],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    doNotTrack: navigator.doNotTrack,
  };
}

/**
 * Detect available fonts (client-side)
 */
export function detectFonts(): string[] {
  if (typeof window === 'undefined' || typeof document === 'undefined') return [];
  
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 
    'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black',
    'Impact', 'Helvetica', 'Tahoma', 'Geneva'
  ];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  
  const baselines: Record<string, number> = {};
  
  // Get baseline widths
  baseFonts.forEach(font => {
    ctx.font = `${testSize} ${font}`;
    baselines[font] = ctx.measureText(testString).width;
  });
  
  // Test each font
  const detectedFonts: string[] = [];
  testFonts.forEach(font => {
    let detected = false;
    
    baseFonts.forEach(baseFont => {
      ctx.font = `${testSize} '${font}', ${baseFont}`;
      const width = ctx.measureText(testString).width;
      
      if (width !== baselines[baseFont]) {
        detected = true;
      }
    });
    
    if (detected) {
      detectedFonts.push(font);
    }
  });
  
  return detectedFonts.sort();
}

/**
 * Hash a string using SHA-256 (client-side)
 */
export async function hashString(str: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for server-side or old browsers
    return btoa(str);
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate fingerprint confidence score (0-100)
 */
function calculateConfidence(signals: DeviceFingerprint): number {
  let score = 0;
  
  // Canvas fingerprint (30 points)
  if (signals.canvas && signals.canvas.length > 100) score += 30;
  
  // Audio fingerprint (20 points)
  if (signals.audio && signals.audio !== 'timeout' && signals.audio !== '') score += 20;
  
  // WebGL fingerprint (20 points)
  if (signals.webgl && signals.webgl.includes('|')) score += 20;
  
  // Screen info (10 points)
  if (signals.screen.width > 0 && signals.screen.height > 0) score += 10;
  
  // Hardware info (10 points)
  if (signals.hardware.cores > 0) score += 5;
  if (signals.hardware.memory > 0) score += 5;
  
  // Browser info (10 points)
  if (signals.browser.plugins.length > 0) score += 5;
  if (signals.fonts.length > 0) score += 5;
  
  return score;
}

/**
 * Generate complete device fingerprint (client-side)
 */
export async function generateDeviceFingerprint(): Promise<FingerprintResult> {
  const signals: DeviceFingerprint = {
    canvas: generateCanvasFingerprint(),
    audio: await generateAudioFingerprint(),
    webgl: generateWebGLFingerprint(),
    screen: getScreenInfo(),
    hardware: getHardwareInfo(),
    browser: getBrowserInfo(),
    fonts: detectFonts(),
  };
  
  // Combine all signals into a single string
  const combined = JSON.stringify(signals);
  
  // Hash the combined signals
  const fingerprint = await hashString(combined);
  
  // Calculate confidence
  const confidence = calculateConfidence(signals);
  
  return {
    fingerprint,
    confidence,
    signals,
  };
}

/**
 * Compare two fingerprints and return similarity score (0-100)
 */
export function compareFingerprints(fp1: string, fp2: string): number {
  if (fp1 === fp2) return 100;
  
  // Simple comparison - in production, use more sophisticated matching
  let matches = 0;
  const len = Math.min(fp1.length, fp2.length);
  
  for (let i = 0; i < len; i++) {
    if (fp1[i] === fp2[i]) matches++;
  }
  
  return Math.round((matches / len) * 100);
}

/**
 * Server-side: Store fingerprint in session
 */
export async function storeFingerprint(sessionId: string, fingerprint: FingerprintResult) {
  // This would be called from an API route
  // Store in database or session storage
  return {
    sessionId,
    fingerprint: fingerprint.fingerprint,
    confidence: fingerprint.confidence,
    storedAt: new Date(),
  };
}

/**
 * Server-side: Verify fingerprint matches session
 */
export async function verifyFingerprint(
  sessionId: string, 
  currentFingerprint: string,
  storedFingerprint: string
): Promise<{ match: boolean; similarity: number }> {
  const similarity = compareFingerprints(currentFingerprint, storedFingerprint);
  
  // Consider a match if similarity is >= 70%
  const match = similarity >= 70;
  
  return { match, similarity };
}

