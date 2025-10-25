# Admin Session Enhancements

## Overview

The admin sessions page has been significantly enhanced with advanced monitoring, threat detection, and user management capabilities. This document outlines the new features and how to use them.

---

## 🔐 Permission Requirements

### Access Control

This feature implements **granular RBAC permission checks** to ensure only authorized users can monitor and manage sessions.

#### Required Permissions

| Feature | Permission | OWNER | ADMIN | MODERATOR | STAFF | USER |
|---------|-----------|-------|-------|-----------|-------|------|
| **View Admin Sessions Page** | `sessions:view_all` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View Session Analytics** | `sessions:view_analytics` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Revoke Any Session** | `sessions:revoke_any` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Configure Policies** | `sessions:configure_policies` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Health Monitoring** | `sessions:view_health` | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Default Access

- **👑 OWNER** - Full access to all session features
- **🛡️ ADMIN** - Full access to viewing and managing sessions
- **⚖️ MODERATOR** - Read-only access (can view but not revoke)
- **👔 STAFF** - No access to admin session features
- **👤 USER** - Can only view and manage own sessions

#### Custom Roles

Custom roles can be granted specific session management permissions:
- Navigate: **Admin → User Roles → Configure Roles**
- Check "Session Management" category
- Select specific permissions to grant

**Example Use Cases:**
- **Security Team:** Grant all session permissions for full monitoring
- **Support Team:** Grant `view_all` + `revoke_any` for user support
- **Audit Team:** Grant `view_all` + `view_analytics` (read-only)

### Permission Enforcement

✅ **Page-level checks** - Must have `sessions:view_all` to access page  
✅ **API-level checks** - Each endpoint validates required permissions  
✅ **Operation-specific** - Different permissions for view vs. revoke  
✅ **Clear errors** - Shows which permission is missing (403 Forbidden)  
✅ **Audit logging** - All access attempts logged for security  

---

**See Also:**
- [RBAC Permission Enforcement](../rbac-permissions/RBAC_PERMISSION_ENFORCEMENT.md) - Complete guide
- [Permission Flow Visual](../rbac-permissions/PERMISSION_FLOW_VISUAL.md) - Visual diagrams

---

## 🚀 Key Features

### 1. **Interactive User Session Management**

Located at the top of the admin sessions page, this new component provides:

- **Real-time Statistics** - Live updating metrics for:
  - Active Sessions (with trend indicators)
  - Active Users
  - Recent Logins (24h)
  - Suspicious Sessions (with visual alerts)

- **Advanced Search & Filtering**
  - Search by user name or email
  - Filter by role (Owner, Admin, Moderator, Staff, User)
  - Filter by risk level (High Risk, Low Risk)
  - Sort by name, session count, or risk score

- **Per-User Session Details**
  - Active session count
  - Suspicious session count
  - Risk score (0-100 scale with color coding)
  - Last login timestamp
  - One-click access to view individual sessions

- **Bulk Operations**
  - Auto-refresh every 30 seconds
  - Manual refresh button
  - Export user data to CSV
  - Bulk revoke suspicious sessions (with confirmation)

### 2. **Threat Detection Panel**

AI-powered threat detection with real-time alerts:

#### Threat Types Detected
- **Multiple Failed Logins** - Brute force attack detection
- **VPN Detection** - Commercial VPN usage tracking
- **Location Anomalies** - Impossible travel detection
- **Session Takeover Attempts** - Suspicious session behavior
- **Device Fingerprint Changes** - Device spoofing detection

#### Severity Levels
- 🔴 **Critical** - Immediate action required
- 🟠 **High** - Action recommended
- 🟡 **Medium** - Monitor closely
- 🔵 **Low** - Informational

#### Quick Actions
For each threat, admins can:
- **Investigate** - Mark as under investigation
- **Block Now** - Immediately terminate sessions (critical threats only)
- **Resolve** - Mark threat as handled

### 3. **Live Activity Timeline**

Real-time session activity stream showing:
- ✅ Login events (with location and device)
- 🚪 Logout events
- ⚠️ Suspicious activity alerts
- 🔒 Session revocations
- 📡 Live indicator (updates every 10 seconds)

Each event displays:
- User information
- Event details
- Geographic location
- Device information
- Relative timestamp

### 4. **Detailed Analytics** (Existing + Enhanced)

The original analytics have been preserved and improved:

#### Device Breakdown
- Session distribution by device type
- Percentage calculations
- Visual progress bars

#### Trust Levels
- New (first-time devices)
- Recognized (seen before)
- Trusted (verified over time)

#### Geographic Distribution
- Top 10 countries by session count
- Visual distribution with session counts

#### Activity Breakdown
- Last 7 days of activity
- Action types with counts
- Top 10 most common actions

#### Suspicious Sessions
- Last 7 days of flagged sessions
- User details with device info
- Location and timestamp information

#### Recent Activity Log
- Last 24 hours of all activity
- Detailed endpoint tracking
- User attribution
- Scrollable list (top 50 shown)

## 🔧 Technical Implementation

### Component Architecture

```
app/admin/sessions/
├── page.tsx                           # Server component (data fetching)
├── components/
│   ├── AdminSessionsClient.tsx       # Client component (interactive UI)
│   ├── ThreatDetectionPanel.tsx      # Threat monitoring
│   └── SessionTimeline.tsx           # Live activity feed
```

### API Endpoints

#### GET `/api/admin/sessions/users`
Returns all users with active sessions and their statistics.

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "activeSessions": 2,
      "suspiciousSessions": 0,
      "riskScore": 15,
      "lastLogin": "2025-10-25T12:00:00Z"
    }
  ],
  "total": 42
}
```

**Authentication:** Admin/Owner required  
**Rate Limit:** None (admin endpoint)  
**Caching:** `force-dynamic` (always fresh data)

### Data Flow

1. **Server-Side Rendering** (page.tsx)
   - Fetches initial statistics from database
   - Groups sessions by user
   - Calculates risk scores
   - Passes data to client components

2. **Client-Side Interactivity** (AdminSessionsClient.tsx)
   - Auto-refreshes every 30 seconds
   - Handles search and filtering
   - Manages sorting
   - Triggers bulk operations

3. **Real-Time Monitoring** (ThreatDetectionPanel.tsx & SessionTimeline.tsx)
   - Polls for new threats/events
   - Updates UI without page reload
   - Provides instant feedback

## 📊 Risk Score Calculation

Risk scores are calculated based on:
- Number of suspicious sessions (20 points each, max 100)
- Failed login attempts
- Geographic anomalies
- Device changes
- VPN usage

**Risk Score Ranges:**
- 0-24: ✅ Low Risk (Green)
- 25-49: ⚠️ Medium Risk (Yellow)
- 50-69: 🔶 High Risk (Orange)
- 70-100: 🔴 Critical Risk (Red)

## 🔒 Security Features

### Auto-Detection
- **Impossible Travel**: Login from 2 locations within physically impossible timeframe
- **Brute Force**: Multiple failed login attempts from same IP
- **Session Hijacking**: Sudden change in device fingerprint
- **VPN Detection**: Known commercial VPN IP ranges
- **Unusual Hours**: Login during abnormal times for user

### Admin Controls
- **Bulk Revoke**: Terminate all suspicious sessions at once
- **Individual Management**: View and control any user's sessions
- **Export Capability**: Download audit logs for compliance
- **Real-time Alerts**: Instant notification of critical threats

### Audit Trail
All admin actions are logged:
- Session revocations
- Bulk operations
- Threat investigations
- User session views

## 💡 Usage Examples

### Example 1: Investigating Suspicious Activity

1. Navigate to Admin → Sessions
2. Check the "Suspicious" metric in the top stats
3. If suspicious sessions exist:
   - Review the Threat Detection Panel for specific threats
   - Click "Investigate" on any threat
   - Use the User Session Management section to find affected users
   - Filter by "High Risk" to see risky accounts
   - Click the eye icon on a user to view their sessions
   - Revoke individual sessions or use "Revoke Suspicious" for bulk action

### Example 2: Monitoring Active Sessions

1. The page auto-refreshes every 30 seconds
2. Watch the Live Activity Timeline for real-time events
3. Check the top metrics for trends ("+12%" indicators)
4. Use the search bar to find specific users
5. Sort by "sessions" to find users with most active sessions
6. Export data for reporting: Click "Export" button

### Example 3: Responding to Critical Threats

1. Critical threats appear with red borders in Threat Detection Panel
2. Review the threat description and affected users
3. Click "Block Now" to immediately terminate sessions
4. Confirm the action in the dialog
5. Verify in the Activity Timeline that sessions were revoked
6. Mark as "Resolved" once handled

### Example 4: Regular Security Audits

1. Export user session data to CSV
2. Review Geographic Distribution for unexpected countries
3. Check Trust Levels - high percentage of "New" may indicate attacks
4. Review Activity Breakdown for unusual action patterns
5. Examine Recent Activity Log for suspicious endpoints
6. Document findings and take action as needed

## 🎨 UI/UX Highlights

### Visual Indicators
- 🟢 Live indicator - Auto-updating components
- 📊 Trend arrows - "+12%" for growing metrics
- 🎨 Color-coded risks - Instant severity recognition
- 🔴 Border alerts - Critical items have red borders
- ⚡ Pulse animations - Active threats

### Responsive Design
- Mobile-friendly layout
- Grid adapts to screen size
- Collapsible sections for smaller screens
- Touch-friendly buttons and controls

### Performance
- Auto-refresh without flickering
- Optimized database queries
- Lazy loading for large datasets
- Client-side filtering for instant results

## 🔮 Future Enhancements

Potential additions for next version:
- [ ] Session comparison tool (detect account takeover)
- [ ] Automated response rules (auto-block on critical threats)
- [ ] Email notifications for admins
- [ ] Integration with security SIEM tools
- [ ] Machine learning risk scoring
- [ ] Session replay for audit purposes
- [ ] Geographic heatmap visualization
- [ ] Custom alert thresholds
- [ ] Webhook integrations
- [ ] Advanced search with regex support

## 📝 Best Practices

### For Admins

1. **Monitor Regularly**: Check the admin sessions page at least daily
2. **Investigate Promptly**: Don't ignore "Investigating" status threats
3. **Trust Your Metrics**: High risk scores require action
4. **Keep Records**: Export data monthly for compliance
5. **Stay Updated**: Review new threat types as they're added

### For Security Teams

1. **Set Baselines**: Know your normal session counts and patterns
2. **Watch Trends**: Monitor the trend indicators ("+12%")
3. **Correlate Data**: Use the timeline with threat panel for full picture
4. **Document Actions**: Always mark threats as resolved with notes
5. **Tune Alerts**: Work with developers to adjust sensitivity

### For Compliance

1. **Regular Exports**: Schedule monthly or quarterly exports
2. **Audit Trails**: Keep records of all admin actions
3. **Risk Documentation**: Document high-risk users and actions taken
4. **Access Reviews**: Regular review of who has admin access
5. **Incident Reports**: Use exported data for security incidents

## 🐛 Troubleshooting

### Issue: Stats Not Updating

**Solution:** 
- Check browser console for errors
- Verify internet connection
- Manually click "Refresh" button
- Hard refresh the page (Ctrl+Shift+R)

### Issue: High Number of False Positives

**Solution:**
- Review VPN detection settings (many users use VPNs legitimately)
- Adjust impossible travel thresholds for edge cases
- Mark false positives as "Resolved" to train the system

### Issue: Slow Page Load

**Solution:**
- Large user bases (>1000 active users) may be slow
- Database queries are limited to 500 sessions
- Consider pagination in future version
- Check database indexes on Session table

### Issue: Export Not Working

**Solution:**
- Check browser popup blocker
- Ensure JavaScript is enabled
- Try a different browser
- Check browser console for errors

## 📚 Related Documentation

- [Enhanced Session Management](./ENHANCED_SESSION_MANAGEMENT.md) - User-facing session features
- [Session UI Guide](./SESSION_UI_GUIDE.md) - User profile session components
- [Two-Factor Auth](./TWO_FACTOR_AUTH.md) - 2FA implementation
- [RBAC System](./RBAC_SYSTEM.md) - Role-based access control

## 🎯 Summary

The admin sessions page is now a comprehensive security dashboard providing:
- ✅ Real-time monitoring
- ✅ Threat detection
- ✅ User management
- ✅ Bulk operations
- ✅ Advanced analytics
- ✅ Audit capabilities
- ✅ Beautiful UI

Admins can now proactively monitor, detect, and respond to security threats across all user sessions in the application.

