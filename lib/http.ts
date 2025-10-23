// Reusable, hardened HTTP helpers for JSON endpoints.
// Safe defaults: timeouts, limited retries for GET, strict JSON parsing, and detailed errors.

const DEFAULT_TIMEOUT_MS = 10000; // 10s
const MAX_ERROR_BODY_PREVIEW = 2000; // chars
const GET_RETRY_ATTEMPTS = 2; // total attempts = 1 + retries
const MAX_REQUEST_BODY_SIZE = 10_000_000; // 10MB
const MAX_RESPONSE_SIZE = 5_000_000; // 5MB

// Request deduplication cache for identical in-flight GET requests
const inFlightRequests = new Map<string, Promise<any>>();

// Lightweight error carrying response context for better debugging/handling
export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly method: string;
  readonly bodyText?: string;

  constructor(params: { method: string; url: string; status: number; statusText: string; bodyText?: string }) {
    const { method, url, status, statusText } = params;
    super(`${method} ${url} failed: ${status} ${statusText}`);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.method = method;
    if (params.bodyText !== undefined) {
      this.bodyText = params.bodyText;
    }
  }
}

function jsonStringifySafe(value: unknown): string {
  const stringified = JSON.stringify(
    value,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
  );
  // Security: prevent oversized request bodies
  if (stringified.length > MAX_REQUEST_BODY_SIZE) {
    throw new Error(`Request body too large: ${stringified.length} bytes exceeds ${MAX_REQUEST_BODY_SIZE} bytes`);
  }
  return stringified;
}

function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Security: only allow http/https protocols to prevent SSRF attacks
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    // Security: block private IP ranges and localhost in production
    // Note: This is a basic check; for production, consider a more robust solution
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('169.254.') || // Link-local
      hostname.startsWith('10.') || // Private class A
      hostname.startsWith('192.168.') || // Private class C
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) // Private class B
    ) {
      // Allow in development
      if (process.env.NODE_ENV === 'production') {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function isJsonContentType(res: Response): boolean {
  const ct = res.headers.get("content-type")?.toLowerCase() ?? "";
  return ct.includes("application/json") || ct.includes("+json");
}

async function readErrorPreview(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text();
    if (!text) return undefined;
    return text.length > MAX_ERROR_BODY_PREVIEW ? text.slice(0, MAX_ERROR_BODY_PREVIEW) + "…" : text;
  } catch {
    return undefined;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status: number): boolean {
  // Conservative: retry transient server or rate-limit responses
  return status === 429 || (status >= 500 && status < 600);
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJSON<T>(
  method: string,
  url: string,
  body?: unknown,
  extraHeaders?: HeadersInit,
  options?: { timeoutMs?: number; skipCache?: boolean }
): Promise<T> {
  // Security: validate URL to prevent SSRF attacks
  if (!isValidHttpUrl(url)) {
    throw new Error(`Invalid or unsafe URL: ${url}`);
  }

  // Performance: deduplicate identical in-flight GET requests
  const cacheKey = `${method}:${url}`;
  if (method === "GET" && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  // Build request
  const headers = new Headers(extraHeaders ?? {});
  
  // Performance: enable compression for responses
  if (!headers.has("accept-encoding")) {
    headers.set("accept-encoding", "gzip, deflate, br");
  }
  
  // Performance: connection keep-alive hint
  if (!headers.has("connection")) {
    headers.set("connection", "keep-alive");
  }

  const init: RequestInit & { timeoutMs?: number } = {
    method,
    headers,
    ...(method === "GET" && !options?.skipCache ? { cache: "no-store" as const } : {}),
    ...(options?.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
  };
  
  if (body !== undefined) {
    // Only set content-type if caller hasn't provided it
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    init.body = jsonStringifySafe(body);
  }

  // Performance: wrap GET requests with deduplication
  const executeRequest = async (): Promise<T> => {
    // GET retries on transient errors with exponential backoff + jitter
    const attempts = method === "GET" ? 1 + GET_RETRY_ATTEMPTS : 1;
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetchWithTimeout(url, init);
        if (!res.ok) {
          if (attempts > 1 && shouldRetry(res.status) && i < attempts - 1) {
            // Respect Retry-After (seconds) when present; otherwise exp backoff
            const retryAfter = res.headers.get("retry-after");
            const waitMs = retryAfter ? Math.min(Number(retryAfter) * 1000 || 0, 15000) : Math.min(250 * 2 ** i, 2000);
            const jitter = Math.random() * 200;
            await sleep(waitMs + jitter);
            continue;
          }
          const preview = await readErrorPreview(res);
          throw new HttpError({ method, url, status: res.status, statusText: res.statusText, ...(preview !== undefined ? { bodyText: preview } : {}) });
        }
        // Strict JSON parsing: only parse JSON content types
        if (!isJsonContentType(res)) {
          const preview = await readErrorPreview(res);
          throw new HttpError({ method, url, status: 415, statusText: "Unsupported Media Type (expected JSON)", ...(preview !== undefined ? { bodyText: preview } : {}) });
        }
        // Security: reject very large payloads when content-length indicates it
        const lenHeader = res.headers.get("content-length");
        const contentLength = lenHeader ? Number(lenHeader) : undefined;
        if (contentLength && contentLength > MAX_RESPONSE_SIZE) {
          throw new HttpError({ method, url, status: 413, statusText: "Payload Too Large" });
        }
        return (await res.json()) as T;
      } catch (err: any) {
        lastErr = err;
        // AbortError or network-level errors: retry only for GET
        if (attempts > 1 && i < attempts - 1) {
          await sleep(Math.min(250 * 2 ** i, 2000));
          continue;
        }
        throw err;
      }
    }
    // Should be unreachable
    throw lastErr ?? new Error("Request failed");
  };

  // Performance: deduplicate GET requests
  if (method === "GET") {
    const promise = executeRequest();
    inFlightRequests.set(cacheKey, promise);
    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up after request completes
      inFlightRequests.delete(cacheKey);
    }
  }

  return executeRequest();
}

// Public helpers (simple signatures)
export async function getJSON<T>(url: string, options?: { timeoutMs?: number; skipCache?: boolean }) {
  return requestJSON<T>("GET", url, undefined, undefined, options);
}

export async function postJSON<T>(url: string, body: unknown, options?: { timeoutMs?: number }) {
  return requestJSON<T>("POST", url, body, undefined, options);
}

export async function patchJSON<T>(url: string, body: unknown, options?: { timeoutMs?: number }) {
  return requestJSON<T>("PATCH", url, body, undefined, options);
}

// Advanced helper with full control
export async function requestWithHeaders<T>(
  method: string,
  url: string,
  body?: unknown,
  headers?: HeadersInit,
  options?: { timeoutMs?: number; skipCache?: boolean }
) {
  return requestJSON<T>(method, url, body, headers, options);
}

export async function del(url: string, options?: { timeoutMs?: number }) {
  // Security: validate URL to prevent SSRF attacks
  if (!isValidHttpUrl(url)) {
    throw new Error(`Invalid or unsafe URL: ${url}`);
  }
  
  // For delete we don't require JSON response; return true on 2xx
  const res = await fetchWithTimeout(url, { 
    method: "DELETE",
    ...(options?.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {})
  });
  if (!res.ok) {
    const preview = await readErrorPreview(res);
    throw new HttpError({ method: "DELETE", url, status: res.status, statusText: res.statusText, ...(preview !== undefined ? { bodyText: preview } : {}) });
  }
  return true;
}
