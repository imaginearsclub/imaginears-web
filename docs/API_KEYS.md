# API Keys & Rate Limiting System

Complete implementation of API key authentication with rate limiting for external/programmatic access to the Imaginears API.

## 🚀 Features

- **API Key Authentication**: Secure authentication for external services
- **Granular Permissions**: Scope-based access control
- **Rate Limiting**: Per-key request limiting (default: 100 req/min)
- **Usage Tracking**: Monitor API key usage and last access
- **Key Rotation**: Generate new keys, revoke old ones
- **Audit Logging**: Complete audit trail of API key operations

## 📊 Database Schema

### ApiKey Model
```prisma
model ApiKey {
  id          String   @id @default(cuid())
  name        String   // Friendly name (e.g., "Mobile App")
  key         String   @unique // Hashed API key
  keyPrefix   String   // First 16 chars for identification
  scopes      Json     // Array of scopes
  isActive    Boolean  @default(true)
  rateLimit   Int      @default(100) // Requests per minute
  lastUsedAt  DateTime?
  usageCount  Int      @default(0)
  description String?
  expiresAt   DateTime?
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### RateLimit Model
```prisma
model RateLimit {
  id          String   @id @default(cuid())
  identifier  String   // API key ID or IP
  endpoint    String   // Endpoint path
  count       Int      @default(1)
  windowStart DateTime @default(now())
}
```

## 🔑 API Key Format

```
sk_live_[32 random hexadecimal characters]
Example: sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

- `sk` = Secret Key
- `live` = Environment (could be `test` for testing)
- Keys are hashed with SHA-256 before storage
- Only shown once at creation

## 🎯 Available Scopes

| Scope | Description |
|-------|-------------|
| `public:read` | Read public data (events, etc.) |
| `events:read` | Read event information |
| `events:write` | Create and modify events |
| `applications:read` | Read application data |
| `applications:write` | Create and modify applications |
| `users:read` | Read user information |
| `server:read` | Read server status and metrics |

## 📝 Usage

### Creating an API Key (Admin Only)

**POST** `/api/admin/api-keys`

```json
{
  "name": "Mobile App",
  "description": "API key for the Imaginears mobile application",
  "scopes": ["public:read", "events:read"],
  "rateLimit": 200,
  "expiresAt": "2025-12-31T23:59:59Z" // optional
}
```

**Response:**
```json
{
  "apiKey": {
    "id": "clx123abc...",
    "name": "Mobile App",
    "key": "sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "keyPrefix": "sk_live_a1b2c3d4",
    "scopes": ["public:read", "events:read"],
    "rateLimit": 200,
    "createdAt": "2025-01-15T..."
  },
  "message": "API key created successfully. Save this key - it won't be shown again!"
}
```

⚠️ **Important**: The full `key` is only returned once! Save it securely.

### Using an API Key

Include the API key in your requests using either method:

**Method 1: Authorization Header**
```bash
curl -H "Authorization: Bearer sk_live_YOUR_KEY" \
  https://imaginears.club/api/events/public
```

**Method 2: X-API-Key Header**
```bash
curl -H "X-API-Key: sk_live_YOUR_KEY" \
  https://imaginears.club/api/events/public
```

### Example: Fetch Public Events

```bash
curl -H "Authorization: Bearer sk_live_YOUR_KEY" \
  "https://imaginears.club/api/events/public?status=Published&limit=10"
```

**Response:**
```json
{
  "events": [
    {
      "id": "evt_123",
      "title": "Castle Fireworks",
      "description": "Spectacular fireworks show",
      "category": "Fireworks",
      "startTime": "2025-02-01T20:00:00Z",
      "endTime": "2025-02-01T20:30:00Z",
      "location": "Cinderella Castle",
      "status": "Published"
    }
  ],
  "pagination": {
    "nextCursor": "evt_456",
    "limit": 10
  },
  "meta": {
    "count": 10,
    "apiKeyName": "Mobile App"
  }
}
```

### Rate Limiting

API keys enforce rate limits based on their configuration:

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705356120
```

When rate limited (429 response):
```json
{
  "error": "Rate limit exceeded. Try again in 45s"
}
```

## 🛠️ Admin Management Endpoints

### List All API Keys
**GET** `/api/admin/api-keys`

Returns list of all API keys (without actual key values).

### Update API Key
**PATCH** `/api/admin/api-keys/[id]`

```json
{
  "name": "Updated Name",
  "isActive": false,
  "rateLimit": 150,
  "scopes": ["public:read"]
}
```

### Delete API Key
**DELETE** `/api/admin/api-keys/[id]`

Permanently deletes an API key. Cannot be undone.

## 🔒 Security Features

1. **Keys are hashed**: Stored as SHA-256 hashes, not plaintext
2. **Scope-based access**: Keys only work for authorized scopes
3. **Rate limiting**: Prevents abuse and spam
4. **Expiration dates**: Optional key expiration
5. **Active/inactive toggle**: Temporarily disable keys
6. **Audit logging**: All key operations are logged
7. **Usage tracking**: Monitor key usage patterns

## 🧪 Integration Examples

### JavaScript/TypeScript
```typescript
const apiKey = 'sk_live_YOUR_KEY';

async function fetchEvents() {
  const response = await fetch('https://imaginears.club/api/events/public', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return await response.json();
}
```

### Python
```python
import requests

API_KEY = 'sk_live_YOUR_KEY'
BASE_URL = 'https://imaginears.club/api'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

response = requests.get(f'{BASE_URL}/events/public', headers=headers)
data = response.json()
```

### cURL
```bash
#!/bin/bash
API_KEY="sk_live_YOUR_KEY"

curl -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  https://imaginears.club/api/events/public
```

## 📋 Setup Instructions

1. **Run Migration**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

2. **Create First API Key** (via Admin UI or API):
   - Navigate to Admin Dashboard → API Keys
   - Click "Create New API Key"
   - Configure scopes and rate limits
   - Save the generated key securely

3. **Test the API**:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
     https://imaginears.club/api/events/public
   ```

## 🚨 Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Missing required scope |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## 🎯 Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for API keys
3. **Rotate keys regularly** (every 90 days recommended)
4. **Use minimum required scopes** (principle of least privilege)
5. **Monitor key usage** for anomalies
6. **Set expiration dates** for temporary integrations
7. **Revoke unused keys** immediately

## 🔄 Migration Guide

To add API key support to existing endpoints:

```typescript
import { requireApiKey } from "@/lib/api-keys";

export async function GET(req: Request) {
  // Add API key authentication
  const auth = await requireApiKey(req, "events:read");
  
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }
  
  // Your existing endpoint logic
  // auth.apiKey contains the validated key info
}
```

## 📚 Related Documentation

- [Admin Dashboard Guide](./ADMIN_DASHBOARD.md)
- [Rate Limiting](./RATE_LIMITING.md)
- [Security Best Practices](./SECURITY.md)
- [API Reference](./API_REFERENCE.md)

## 🤝 Support

For issues or questions about API keys:
- GitHub Issues: https://github.com/imaginears/imaginears-web/issues
- Email: api@imaginears.club

