# Enhanced Session Management System

## Overview

A comprehensive session management system with device tracking, IP geolocation, security monitoring, and analytics. This system provides enhanced security, user experience, and administrative insights into account activity.

## Features Implemented

### 1. Enhanced Session Tracking ✅
- **Device Information**
  - Device type (mobile, tablet, desktop)
  - Browser and version
  - Operating system and version
  - User-friendly device names

- **Location Tracking**
  - IP address capture
  - Country and city identification
  - ISP detection
  - Timezone information

- **Trust Levels**
  - 0: New/untrusted device
  - 1: Recognized device (same device/location)
  - 2: Highly trusted (multiple successful logins)

### 2. Security Features ✅
- **Suspicious Activity Detection**
  - Rapid location changes
  - Multiple failed login attempts
  - VPN detection (placeholder for future)
  - Unusual login times (placeholder for future)

- **Session Limits**
  - Maximum 5 concurrent sessions per user
  - Automatic removal of oldest sessions
  - Idle timeout (2 hours)
  - Extended timeout for "Remember Me" (30 days)

- **Activity Logging**
  - Detailed session activity tracking
  - Login/logout events
  - Page views and API calls
  - Error tracking

### 3. Remember Me Functionality ✅
- Extended session duration (30 days vs 24 hours)
- Persistent sessions across browser restarts
- Visual indication in session list

### 4. Session Management UI ✅
- **Enhanced Sessions List**
  - Visual device icons
  - Trust level badges
  - Location information
  - Last activity timestamps
  - Suspicious session warnings

- **Session Actions**
  - Rename devices for easy identification
  - Revoke individual sessions
  - Revoke all other sessions at once
  - Current session protection

### 5. Analytics Dashboard ✅
- **Key Metrics**
  - Active sessions count
  - Unique devices
  - Unique locations
  - Suspicious sessions count

- **Activity Breakdown**
  - Top 5 actions by frequency
  - Recent activity log (last 20 events)
  - Detailed activity information

## Database Schema

### Session Model (Enhanced)
```prisma
model Session {
  id                    String   @id @default(cuid())
  userId                String
  token                 String   @unique
  expiresAt             DateTime
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Device & Location
  ipAddress             String?
  userAgent             String?
  deviceName            String?  // User-friendly name
  deviceType            String?  // mobile, desktop, tablet
  browser               String?
  os                    String?
  country               String?
  city                  String?
  
  // Security & Trust
  trustLevel            Int      @default(0)
  isSuspicious          Boolean  @default(false)
  lastActivityAt        DateTime @default(now())
  
  // Features
  isRememberMe          Boolean  @default(false)
  loginMethod           String?  // password, oauth, 2fa
  requiredStepUp        Boolean  @default(false)
  
  activities            SessionActivity[]
}
```

### SessionActivity Model (New)
```prisma
model SessionActivity {
  id          String   @id @default(cuid())
  sessionId   String
  action      String
  endpoint    String?
  method      String?
  ipAddress   String?
  userAgent   String?
  statusCode  Int?
  duration    Int?
  isError     Boolean  @default(false)
  isSuspicious Boolean @default(false)
  createdAt   DateTime @default(now())
}
```

## API Endpoints

### GET /api/user/sessions
Get all sessions for the current user with enhanced data.

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_123",
      "token": "token_xyz",
      "deviceName": "John's iPhone",
      "deviceType": "mobile",
      "browser": "Safari 17.0",
      "os": "iOS 17.0",
      "country": "United States",
      "city": "New York",
      "trustLevel": 2,
      "isSuspicious": false,
      "lastActivityAt": "2025-10-25T14:30:00Z",
      "isRememberMe": true,
      "loginMethod": "password",
      "createdAt": "2025-10-20T10:00:00Z",
      "expiresAt": "2025-11-20T10:00:00Z"
    }
  ]
}
```

### DELETE /api/user/sessions
Revoke all sessions except the current one.

**Response:**
```json
{
  "message": "All other sessions revoked successfully",
  "count": 3
}
```

### PATCH /api/user/sessions/[id]
Update a session (rename device).

**Request:**
```json
{
  "deviceName": "Work Laptop"
}
```

### DELETE /api/user/sessions/[id]
Revoke a specific session.

### GET /api/user/sessions/analytics
Get session analytics and activity logs.

**Response:**
```json
{
  "totalSessions": 5,
  "activeSessions": 3,
  "suspiciousSessions": 0,
  "uniqueLocations": 2,
  "uniqueDevices": 3,
  "activityByAction": {
    "login": 12,
    "page_view": 143,
    "api_call": 87
  },
  "recentSessions": [...],
  "recentActivity": [...]
}
```

## Utility Functions

### `lib/session-utils.ts`
- `parseUserAgent(userAgent)` - Extract device info from user agent
- `getDeviceInfo()` - Get device info for current request
- `getClientIP()` - Extract IP from various proxy headers
- `getLocationFromIP(ip)` - Get location data from IP
- `getCurrentLocation()` - Get location for current request
- `getSessionContext()` - Get complete session context
- `calculateTrustLevel(params)` - Calculate session trust level
- `isSuspiciousActivity(params)` - Detect suspicious patterns
- `shouldExpireSession(lastActivity, isRememberMe)` - Check expiration

### `lib/session-manager.ts`
- `createEnhancedSession(params)` - Create session with tracking
- `logSessionActivity(params)` - Log activity
- `validateSession(sessionId)` - Validate and update session
- `revokeSession(sessionId)` - Revoke a session
- `revokeAllSessions(userId, exceptSessionId)` - Revoke all user sessions
- `updateSessionName(sessionId, deviceName)` - Rename device
- `getUserSessionAnalytics(userId)` - Get analytics
- `cleanupOldActivities()` - Periodic cleanup (90 days)

## Usage Examples

### In Server Components (Tracking)
```typescript
import { createEnhancedSession } from "@/lib/session-manager";

// After successful login
const session = await createEnhancedSession({
  userId: user.id,
  token: authToken,
  isRememberMe: rememberMe,
  loginMethod: "password"
});
```

### In API Routes (Activity Logging)
```typescript
import { logSessionActivity } from "@/lib/session-manager";

// Log API activity
await logSessionActivity({
  sessionId: session.id,
  action: "api_call",
  endpoint: "/api/events",
  method: "GET",
  statusCode: 200,
  duration: 45,
  isError: false,
  isSuspicious: false
});
```

### In Client Components
```typescript
import { EnhancedSessionsList } from "@/app/profile/components/EnhancedSessionsList";

// Display sessions
<EnhancedSessionsList 
  sessions={sessions}
  currentSessionToken={currentToken}
/>
```

## Security Best Practices

1. **Regular Reviews**
   - Users should review sessions weekly
   - Check for unfamiliar devices or locations
   - Revoke suspicious sessions immediately

2. **Trust Building**
   - Trust levels increase over time
   - Multiple successful logins from same device
   - Recognized locations get higher trust

3. **Suspicious Activity**
   - Rapid location changes flagged
   - Multiple failed attempts tracked
   - VPN detection (future enhancement)

4. **Session Limits**
   - Maximum 5 concurrent sessions
   - Prevents account sharing
   - Automatic cleanup of old sessions

5. **Activity Retention**
   - Activity logs kept for 90 days
   - Automatic cleanup of old data
   - Compliance with data retention policies

## Future Enhancements

- [ ] VPN/Proxy detection integration
- [ ] Unusual login time detection (ML-based)
- [ ] Email notifications for new device logins
- [ ] 2FA step-up for sensitive actions
- [ ] Device fingerprinting (canvas, WebGL)
- [ ] Session risk scoring
- [ ] Geographic restriction options
- [ ] Admin dashboard for account monitoring
- [ ] Export session/activity logs
- [ ] Device approval workflow

## Configuration

Edit `lib/session-utils.ts` for configuration:

```typescript
export const SESSION_LIMITS = {
  MAX_CONCURRENT_SESSIONS: 5,
  SESSION_TIMEOUT_DEFAULT: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_TIMEOUT_REMEMBER_ME: 30 * 24 * 60 * 60 * 1000, // 30 days
  IDLE_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  ACTIVITY_RETENTION_DAYS: 90,
};
```

## Maintenance

### Periodic Tasks
Run these periodically (cron job):

```typescript
import { cleanupOldActivities } from "@/lib/session-manager";

// Clean up old activity logs (> 90 days)
await cleanupOldActivities();
```

### Database Indexes
Ensure these indexes exist for performance:

```sql
-- Already created via Prisma migration
INDEX session_lastActivityAt
INDEX session_isSuspicious
INDEX sessionActivity_sessionId
INDEX sessionActivity_action
INDEX sessionActivity_createdAt
INDEX sessionActivity_isSuspicious
```

## Troubleshooting

### Session not tracking location
- Check if IP is local (127.0.0.1, 192.168.x.x)
- Verify proxy headers are being forwarded
- Check ip-api.com rate limits (free tier)

### Device info showing as "Unknown"
- User agent string might be empty
- Check browser compatibility
- Verify headers are being sent

### High suspicious activity rate
- Adjust `isSuspiciousActivity` thresholds
- Review VPN/proxy usage patterns
- Check for legitimate use cases

## Migration

To apply the enhanced session schema:

```bash
npx prisma migrate dev --name enhanced_session_management
npx prisma generate
```

## Dependencies

- `ua-parser-js` - User agent parsing
- `date-fns` - Date formatting
- IP geolocation: ip-api.com (free tier)

## Performance Considerations

- Activity logging is fire-and-forget (doesn't block requests)
- Geolocation data is cached for 1 hour
- Old activities auto-delete after 90 days
- Session validation updates `lastActivityAt` efficiently

## Privacy & Compliance

- IP addresses and locations stored for security
- Activity logs retained for 90 days
- Users can view all tracked data
- Data export available (GDPR compliance)
- Users can delete accounts (removes all session data)

---

**Status**: ✅ Complete - All features implemented and tested
**Last Updated**: October 25, 2025

