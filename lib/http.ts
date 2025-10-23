// Reusable, hardened HTTP helpers for JSON endpoints.
// Safe defaults: timeouts, limited retries for GET, strict JSON parsing, and detailed errors.

const DEFAULT_TIMEOUT_MS = 10000; // 10s
const MAX_ERROR_BODY_PREVIEW = 2000; // chars
const GET_RETRY_ATTEMPTS = 2; // total attempts = 1 + retries

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
  return JSON.stringify(
    value,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
  );
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

async function requestJSON<T>(method: string, url: string, body?: unknown, extraHeaders?: HeadersInit): Promise<T> {
  // Build request
  const headers: HeadersInit = extraHeaders ?? {};
  const init: RequestInit & { timeoutMs?: number } = {
    method,
    headers,
    ...(method === "GET" ? { cache: "no-store" as const } : {}),
  };
  if (body !== undefined) {
    // Only set content-type if caller hasn't provided it
    const h = new Headers(headers);
    if (!h.has("content-type")) h.set("content-type", "application/json");
    init.headers = h;
    init.body = jsonStringifySafe(body);
  }

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
      // Optional safety: reject very large payloads when content-length indicates it
      const lenHeader = res.headers.get("content-length");
      const contentLength = lenHeader ? Number(lenHeader) : undefined;
      if (contentLength && contentLength > 5_000_000) {
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
}

// Public helpers (kept same signatures)
export async function getJSON<T>(url: string) {
  return requestJSON<T>("GET", url);
}

export async function postJSON<T>(url: string, body: unknown) {
  return requestJSON<T>("POST", url, body);
}

export async function patchJSON<T>(url: string, body: unknown) {
  return requestJSON<T>("PATCH", url, body);
}

export async function del(url: string) {
  // For delete we don't require JSON response; return true on 2xx
  const res = await fetchWithTimeout(url, { method: "DELETE" });
  if (!res.ok) {
    const preview = await readErrorPreview(res);
    throw new HttpError({ method: "DELETE", url, status: res.status, statusText: res.statusText, ...(preview !== undefined ? { bodyText: preview } : {}) });
  }
  return true;
}
