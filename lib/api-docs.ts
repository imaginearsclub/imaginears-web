/**
 * API Documentation Structure
 * Complete documentation for all Imaginears API endpoints
 */

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  title: string;
  description: string;
  category: string;
  authentication: "session" | "api-key" | "admin" | "public";
  requiredScope?: string;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  examples: ApiExample[];
}

export interface ApiParameter {
  name: string;
  in: "query" | "path" | "header";
  type: "string" | "number" | "boolean";
  required: boolean;
  description: string;
  default?: string | number | boolean;
  enum?: string[];
}

export interface ApiRequestBody {
  type: "application/json" | "multipart/form-data";
  schema: Record<string, any>;
  example: Record<string, any>;
}

export interface ApiResponse {
  status: number;
  description: string;
  schema?: Record<string, any>;
  example?: any;
}

export interface ApiExample {
  title: string;
  language: "curl" | "javascript" | "python" | "typescript";
  code: string;
}

export const API_CATEGORIES = [
  { id: "events", name: "Events", icon: "Calendar", description: "Event management endpoints" },
  { id: "applications", name: "Applications", icon: "FileText", description: "Staff application endpoints" },
  { id: "sessions", name: "Sessions", icon: "Activity", description: "Session management and security" },
  { id: "users", name: "Users", icon: "Users", description: "User management endpoints" },
  { id: "api-keys", name: "API Keys", icon: "Key", description: "API key management" },
  { id: "server", name: "Server", icon: "Server", description: "Server status and metrics" },
  { id: "auth", name: "Authentication", icon: "Shield", description: "Authentication endpoints" },
] as const;

export const API_ENDPOINTS: ApiEndpoint[] = [
  // ========== PUBLIC EVENTS ==========
  {
    id: "events-public-list",
    method: "GET",
    path: "/api/events/public",
    title: "List Public Events",
    description: "Get a list of published events with full recurring schedule details. Supports filtering, pagination, and sorting. Recurring events include show times (timesJson) and days (byWeekdayJson).",
    category: "events",
    authentication: "api-key",
    requiredScope: "public:read",
    parameters: [
      {
        name: "status",
        in: "query",
        type: "string",
        required: false,
        description: "Filter by event status",
        enum: ["Published", "Scheduled", "Draft", "Archived"],
      },
      {
        name: "category",
        in: "query",
        type: "string",
        required: false,
        description: "Filter by event category",
        enum: ["Fireworks", "SeasonalOverlay", "MeetAndGreet", "Parade", "Other"],
      },
      {
        name: "limit",
        in: "query",
        type: "number",
        required: false,
        description: "Maximum number of results (1-100)",
        default: 50,
      },
      {
        name: "cursor",
        in: "query",
        type: "string",
        required: false,
        description: "Pagination cursor (event ID)",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          events: [
            {
              id: "evt_123abc",
              title: "Castle Fireworks Spectacular",
              world: "imaginears",
              shortDescription: "Watch the magic light up the night sky",
              details: "Join us for a spectacular fireworks show above the castle...",
              category: "Fireworks",
              startAt: "2025-02-01T20:00:00Z",
              endAt: "2025-02-01T20:30:00Z",
              status: "Published",
              timezone: "America/New_York",
              // Recurrence details - this event repeats weekly
              recurrenceFreq: "WEEKLY",
              byWeekdayJson: ["FR", "SA", "SU"], // Fridays, Saturdays, Sundays
              timesJson: ["20:00", "22:00"], // Two shows per night
              recurrenceUntil: "2025-12-31T23:59:59Z", // Repeats until end of year
              createdAt: "2025-01-15T10:00:00Z",
              updatedAt: "2025-01-15T10:00:00Z",
            },
          ],
          pagination: {
            nextCursor: "evt_456def",
            limit: 50,
          },
          meta: {
            count: 1,
            apiKeyName: "Mobile App",
          },
        },
      },
      {
        status: 401,
        description: "Unauthorized - Invalid or missing API key",
        example: { error: "API key required" },
      },
      {
        status: 429,
        description: "Rate limit exceeded",
        example: { error: "Rate limit exceeded. Try again in 45s" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://imaginears.club/api/events/public?status=Published&limit=10"`,
      },
      {
        title: "JavaScript (Fetch)",
        language: "javascript",
        code: `const response = await fetch('https://imaginears.club/api/events/public?status=Published&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const data = await response.json();
console.log(data.events);`,
      },
      {
        title: "Python",
        language: "python",
        code: `import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
response = requests.get(
    'https://imaginears.club/api/events/public',
    params={'status': 'Published', 'limit': 10},
    headers=headers
)
data = response.json()
print(data['events'])`,
      },
    ],
  },

  // ========== ADMIN - APPLICATIONS ==========
  {
    id: "admin-applications-list",
    method: "GET",
    path: "/api/admin/applications",
    title: "List Applications",
    description: "Get all staff applications with optional filtering and pagination. Admin authentication required.",
    category: "applications",
    authentication: "admin",
    parameters: [
      {
        name: "status",
        in: "query",
        type: "string",
        required: false,
        description: "Filter by application status",
        enum: ["New", "InReview", "Approved", "Rejected"],
      },
      {
        name: "q",
        in: "query",
        type: "string",
        required: false,
        description: "Search by name, email, Minecraft username, or Discord",
      },
      {
        name: "take",
        in: "query",
        type: "number",
        required: false,
        description: "Number of results (max 200)",
        default: 50,
      },
      {
        name: "cursor",
        in: "query",
        type: "string",
        required: false,
        description: "Pagination cursor (application ID)",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          items: [
            {
              id: "app_123",
              name: "John Doe",
              email: "john@example.com",
              mcUsername: "JohnMC",
              role: "Developer",
              status: "New",
              createdAt: "2025-01-15T10:00:00Z",
              notes: null,
            },
          ],
          nextCursor: "app_456",
        },
      },
      {
        status: 401,
        description: "Unauthorized - Admin authentication required",
        example: { error: "Unauthorized" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Cookie: YOUR_SESSION_COOKIE" \\
  "https://imaginears.club/api/admin/applications?status=New"`,
      },
      {
        title: "JavaScript",
        language: "javascript",
        code: `const response = await fetch('https://imaginears.club/api/admin/applications?status=New', {
  credentials: 'include' // Include session cookie
});
const data = await response.json();`,
      },
    ],
  },

  // ========== ADMIN - API KEYS ==========
  {
    id: "admin-api-keys-create",
    method: "POST",
    path: "/api/admin/api-keys",
    title: "Create API Key",
    description: "Generate a new API key with specified scopes and rate limits. The full key is only shown once.",
    category: "api-keys",
    authentication: "admin",
    requestBody: {
      type: "application/json",
      schema: {
        name: "string (required)",
        description: "string (optional)",
        scopes: "string[] (required)",
        rateLimit: "number (optional, default: 100)",
        expiresAt: "ISO 8601 date string (optional)",
      },
      example: {
        name: "Mobile App",
        description: "API key for the Imaginears mobile application",
        scopes: ["public:read", "events:read"],
        rateLimit: 200,
        expiresAt: "2025-12-31T23:59:59Z",
      },
    },
    responses: [
      {
        status: 200,
        description: "API key created successfully",
        example: {
          apiKey: {
            id: "key_123",
            name: "Mobile App",
            key: "sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
            keyPrefix: "sk_live_a1b2c3d4",
            scopes: ["public:read", "events:read"],
            rateLimit: 200,
            createdAt: "2025-01-15T10:00:00Z",
          },
          message: "API key created successfully. Save this key - it won't be shown again!",
        },
      },
      {
        status: 400,
        description: "Invalid request",
        example: { error: "At least one scope is required" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -X POST https://imaginears.club/api/admin/api-keys \\
  -H "Cookie: YOUR_SESSION_COOKIE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Mobile App",
    "scopes": ["public:read", "events:read"],
    "rateLimit": 200
  }'`,
      },
      {
        title: "JavaScript",
        language: "javascript",
        code: `const response = await fetch('https://imaginears.club/api/admin/api-keys', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mobile App',
    scopes: ['public:read', 'events:read'],
    rateLimit: 200
  })
});
const data = await response.json();
console.log('API Key:', data.apiKey.key);`,
      },
    ],
  },

  {
    id: "admin-api-keys-list",
    method: "GET",
    path: "/api/admin/api-keys",
    title: "List API Keys",
    description: "Get all API keys (without the actual key values). Shows metadata, usage stats, and scopes.",
    category: "api-keys",
    authentication: "admin",
    parameters: [],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          apiKeys: [
            {
              id: "key_123",
              name: "Mobile App",
              keyPrefix: "sk_live_a1b2c3d4",
              scopes: ["public:read", "events:read"],
              isActive: true,
              rateLimit: 200,
              lastUsedAt: "2025-01-15T12:30:00Z",
              usageCount: 1543,
              createdAt: "2025-01-01T10:00:00Z",
            },
          ],
        },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Cookie: YOUR_SESSION_COOKIE" \\
  https://imaginears.club/api/admin/api-keys`,
      },
    ],
  },

  {
    id: "admin-api-keys-update",
    method: "PATCH",
    path: "/api/admin/api-keys/{id}",
    title: "Update API Key",
    description: "Update API key properties like name, scopes, rate limit, or active status.",
    category: "api-keys",
    authentication: "admin",
    parameters: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "API key ID",
      },
    ],
    requestBody: {
      type: "application/json",
      schema: {
        name: "string (optional)",
        description: "string (optional)",
        scopes: "string[] (optional)",
        isActive: "boolean (optional)",
        rateLimit: "number (optional)",
      },
      example: {
        isActive: false,
        rateLimit: 150,
      },
    },
    responses: [
      {
        status: 200,
        description: "API key updated successfully",
      },
      {
        status: 404,
        description: "API key not found",
        example: { error: "API key not found" },
      },
    ],
    examples: [
      {
        title: "cURL - Disable Key",
        language: "curl",
        code: `curl -X PATCH https://imaginears.club/api/admin/api-keys/key_123 \\
  -H "Cookie: YOUR_SESSION_COOKIE" \\
  -H "Content-Type: application/json" \\
  -d '{"isActive": false}'`,
      },
    ],
  },

  {
    id: "admin-api-keys-delete",
    method: "DELETE",
    path: "/api/admin/api-keys/{id}",
    title: "Delete API Key",
    description: "Permanently delete an API key. This action cannot be undone.",
    category: "api-keys",
    authentication: "admin",
    parameters: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "API key ID",
      },
    ],
    responses: [
      {
        status: 200,
        description: "API key deleted successfully",
        example: { message: "API key deleted successfully" },
      },
      {
        status: 404,
        description: "API key not found",
        example: { error: "API key not found" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -X DELETE https://imaginears.club/api/admin/api-keys/key_123 \\
  -H "Cookie: YOUR_SESSION_COOKIE"`,
      },
    ],
  },

  // ========== SESSIONS ==========
  {
    id: "sessions-list-own",
    method: "GET",
    path: "/api/user/sessions",
    title: "List User Sessions",
    description: "Get all active sessions for the current authenticated user. Includes device information, location data, and security metrics.",
    category: "sessions",
    authentication: "session",
    parameters: [],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          sessions: [
            {
              id: "sess_123",
              deviceName: "Chrome on Windows",
              deviceType: "desktop",
              browser: "Chrome",
              os: "Windows 10",
              ipAddress: "192.168.1.100",
              city: "New York",
              country: "United States",
              isp: "Comcast",
              isSuspicious: false,
              trustLevel: 2,
              lastActivityAt: "2025-01-15T14:30:00Z",
              createdAt: "2025-01-15T10:00:00Z",
              expiresAt: "2025-02-15T10:00:00Z",
              isCurrent: true,
            },
          ],
        },
      },
      {
        status: 401,
        description: "Unauthorized - Authentication required",
        example: { error: "Unauthorized" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Cookie: YOUR_SESSION_COOKIE" \\
  https://imaginears.club/api/user/sessions`,
      },
      {
        title: "JavaScript",
        language: "javascript",
        code: `const response = await fetch('https://imaginears.club/api/user/sessions', {
  credentials: 'include'
});
const data = await response.json();
console.log('Active sessions:', data.sessions.length);`,
      },
    ],
  },

  {
    id: "sessions-get-one",
    method: "GET",
    path: "/api/user/sessions/{id}",
    title: "Get Session Details",
    description: "Get detailed information about a specific session including activity history.",
    category: "sessions",
    authentication: "session",
    parameters: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "Session ID",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          session: {
            id: "sess_123",
            deviceName: "Chrome on Windows",
            ipAddress: "192.168.1.100",
            city: "New York",
            country: "United States",
            isSuspicious: false,
            trustLevel: 2,
            createdAt: "2025-01-15T10:00:00Z",
            lastActivityAt: "2025-01-15T14:30:00Z",
          },
          activities: [
            {
              id: "act_456",
              action: "page_view",
              endpoint: "/profile",
              userAgent: "Mozilla/5.0...",
              createdAt: "2025-01-15T14:30:00Z",
            },
          ],
        },
      },
      {
        status: 403,
        description: "Forbidden - Session belongs to another user",
        example: { error: "Forbidden" },
      },
      {
        status: 404,
        description: "Session not found",
        example: { error: "Session not found" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Cookie: YOUR_SESSION_COOKIE" \\
  https://imaginears.club/api/user/sessions/sess_123`,
      },
    ],
  },

  {
    id: "sessions-revoke",
    method: "DELETE",
    path: "/api/user/sessions/{id}",
    title: "Revoke Session",
    description: "Revoke a specific session. The user will be logged out from that device.",
    category: "sessions",
    authentication: "session",
    parameters: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "Session ID",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Session revoked successfully",
        example: { message: "Session revoked successfully" },
      },
      {
        status: 403,
        description: "Cannot revoke current session using this endpoint",
        example: { error: "Use /api/logout to revoke current session" },
      },
      {
        status: 404,
        description: "Session not found",
        example: { error: "Session not found" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -X DELETE \\
  -H "Cookie: YOUR_SESSION_COOKIE" \\
  https://imaginears.club/api/user/sessions/sess_123`,
      },
      {
        title: "JavaScript",
        language: "javascript",
        code: `const response = await fetch('https://imaginears.club/api/user/sessions/sess_123', {
  method: 'DELETE',
  credentials: 'include'
});
if (response.ok) {
  console.log('Session revoked');
}`,
      },
    ],
  },

  {
    id: "sessions-export",
    method: "POST",
    path: "/api/user/sessions/export",
    title: "Export Session Data",
    description: "Export session history and activity logs in various formats (CSV, JSON, PDF, XLSX) for a specified date range.",
    category: "sessions",
    authentication: "session",
    requestBody: {
      type: "application/json",
      schema: {
        format: "string (required) - csv, json, pdf, or xlsx",
        startDate: "ISO 8601 date string (optional)",
        endDate: "ISO 8601 date string (optional)",
      },
      example: {
        format: "csv",
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-01-31T23:59:59Z",
      },
    },
    responses: [
      {
        status: 200,
        description: "File download initiated",
        example: "Binary file data (CSV/JSON/PDF/XLSX)",
      },
      {
        status: 400,
        description: "Invalid format or date range",
        example: { error: "Invalid format specified" },
      },
    ],
    examples: [
      {
        title: "cURL - Export as CSV",
        language: "curl",
        code: `curl -X POST \\
  -H "Cookie: YOUR_SESSION_COOKIE" \\
  -H "Content-Type: application/json" \\
  -d '{"format":"csv","startDate":"2025-01-01T00:00:00Z"}' \\
  -o sessions.csv \\
  https://imaginears.club/api/user/sessions/export`,
      },
      {
        title: "JavaScript",
        language: "javascript",
        code: `const response = await fetch('https://imaginears.club/api/user/sessions/export', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'csv',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-31T23:59:59Z'
  })
});
const blob = await response.blob();
// Download the file
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'sessions.csv';
a.click();`,
      },
    ],
  },

  {
    id: "sessions-risk-assessment",
    method: "GET",
    path: "/api/user/sessions/risk",
    title: "Get Risk Assessment",
    description: "Get AI-powered risk assessment for current user's sessions including risk score, threat analysis, and recommendations.",
    category: "sessions",
    authentication: "session",
    parameters: [],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          overallRisk: 15,
          riskLevel: "low",
          suspiciousSessions: 0,
          threatCategories: {
            impossibleTravel: 0,
            vpnDetection: 0,
            deviceSpoofing: 0,
            bruteForce: 0,
            sessionHijacking: 0,
          },
          recommendations: [
            "All sessions appear secure",
            "Consider enabling 2FA for additional security",
          ],
        },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Cookie: YOUR_SESSION_COOKIE" \\
  https://imaginears.club/api/user/sessions/risk`,
      },
    ],
  },

  {
    id: "sessions-monitoring",
    method: "GET",
    path: "/api/user/sessions/monitoring",
    title: "Real-time Session Monitoring",
    description: "Get real-time monitoring data for active sessions including recent activity, anomalies, and live metrics.",
    category: "sessions",
    authentication: "session",
    parameters: [],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          activeSessions: 2,
          recentActivity: [
            {
              sessionId: "sess_123",
              action: "page_view",
              endpoint: "/profile",
              timestamp: "2025-01-15T14:30:00Z",
            },
          ],
          anomalies: [],
          metrics: {
            avgSessionDuration: 45,
            lastActivity: "2025-01-15T14:30:00Z",
          },
        },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Cookie: YOUR_SESSION_COOKIE" \\
  https://imaginears.club/api/user/sessions/monitoring`,
      },
    ],
  },

  {
    id: "admin-sessions-users",
    method: "GET",
    path: "/api/admin/sessions/users",
    title: "List Users with Session Stats",
    description: "Get all users with active sessions and their statistics. Admin authentication required.",
    category: "sessions",
    authentication: "admin",
    parameters: [],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          users: [
            {
              id: "user_123",
              name: "John Doe",
              email: "john@example.com",
              role: "USER",
              activeSessions: 2,
              suspiciousSessions: 0,
              riskScore: 15,
              lastLogin: "2025-01-15T10:00:00Z",
            },
          ],
          total: 1,
        },
      },
      {
        status: 403,
        description: "Forbidden - Admin access required",
        example: { error: "Forbidden" },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Cookie: YOUR_ADMIN_SESSION_COOKIE" \\
  https://imaginears.club/api/admin/sessions/users`,
      },
      {
        title: "JavaScript",
        language: "javascript",
        code: `const response = await fetch('https://imaginears.club/api/admin/sessions/users', {
  credentials: 'include'
});
const data = await response.json();
console.log(\`\${data.total} users with active sessions\`);`,
      },
    ],
  },

  // ========== SERVER STATUS ==========
  {
    id: "server-status",
    method: "GET",
    path: "/api/server-status",
    title: "Server Status",
    description: "Get Minecraft server status including player count and MOTD.",
    category: "server",
    authentication: "api-key",
    requiredScope: "server:read",
    parameters: [],
    responses: [
      {
        status: 200,
        description: "Success",
        example: {
          online: true,
          players: {
            online: 42,
            max: 100,
          },
          version: "1.20.4",
          motd: "Welcome to Imaginears!",
        },
      },
    ],
    examples: [
      {
        title: "cURL",
        language: "curl",
        code: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://imaginears.club/api/server-status`,
      },
    ],
  },
];

/**
 * Get endpoints by category
 */
export function getEndpointsByCategory(category: string): ApiEndpoint[] {
  return API_ENDPOINTS.filter(endpoint => endpoint.category === category);
}

/**
 * Get endpoint by ID
 */
export function getEndpointById(id: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find(endpoint => endpoint.id === id);
}

/**
 * Get all available scopes
 */
export function getAllScopes(): string[] {
  const scopes = new Set<string>();
  API_ENDPOINTS.forEach(endpoint => {
    if (endpoint.requiredScope) {
      scopes.add(endpoint.requiredScope);
    }
  });
  return Array.from(scopes).sort();
}

