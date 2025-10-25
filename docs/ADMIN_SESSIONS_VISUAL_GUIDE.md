# Admin Sessions - Visual Guide

## 🎨 Page Layout Overview

This guide shows you what the enhanced admin sessions page looks like and how to use each section.

## 📱 Full Page View

```
┌────────────────────────────────────────────────────────────┐
│  🔮 Session Analytics                                      │
│  System-wide session monitoring and security analytics    │
└────────────────────────────────────────────────────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│    📊 152   │    👥 48    │   📈 89     │    ⚠️  3     │
│    Active   │   Active    │  Logins     │ Suspicious  │
│   Sessions  │    Users    │   (24h)     │             │
│   +12% ↗    │             │   +8% ↗     │  🔴 ALERT   │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🔍 [Search users...        ] [All Roles ▼] [All Risk ▼]   │
│                                                             │
│ 🔄 Refresh    📥 Export    🔒 Revoke Suspicious (3)       │
│                                                             │
│ Sort by: [Name] [Sessions] [Risk]                         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ User Sessions (48)                    Showing 48 of 48     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ John Doe                            2 Sessions    👁️      │
│ john@example.com                    0 Suspicious           │
│ [USER] Last: Oct 25                 Risk: 15 🟢           │
│                                                             │
│ Jane Smith                          5 Sessions    👁️      │
│ jane@example.com                    2 Suspicious           │
│ [ADMIN] Last: Oct 25                Risk: 78 🔴           │
│                                                             │
│ Bob Wilson                          1 Session     👁️      │
│ bob@example.com                     0 Suspicious           │
│ [USER] Last: Oct 24                 Risk: 5  🟢           │
│                                                             │
└────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────┐
│  🛡️ Threat Detection     │  📡 Live Activity Timeline   │
│  ⚡ 1 Critical            │  🟢 Live                     │
├──────────────────────────┼──────────────────────────────┤
│                          │                              │
│  🔴 Location Anomaly     │  ✅ Successful login         │
│  User logged in from     │     john@example.com         │
│  2 countries in 5 min    │     📍 San Francisco, US     │
│  1 user affected         │     💻 Chrome on macOS      │
│  45m ago                 │     5m ago                   │
│                          │                              │
│  [🔍 Investigate]        │  ⚠️ Suspicious activity     │
│  [🔒 Block Now]          │     jane@example.com         │
│  [✅ Resolve]            │     📍 London → Tokyo       │
│                          │     💻 Firefox on Windows   │
│  🟠 Multiple Failed      │     15m ago                  │
│     Logins               │                              │
│  15 attempts from        │  🚪 User logged out         │
│  same IP in 5 min        │     bob@example.com          │
│  3 users affected        │     📍 New York, US         │
│  10m ago                 │     💻 Safari on iOS        │
│  🔍 Investigating        │     30m ago                  │
│                          │                              │
└──────────────────────────┴──────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              📊 Detailed Analytics                         │
└────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────┐
│  💻 Device Types         │  🛡️ Trust Levels            │
├──────────────────────────┼──────────────────────────────┤
│  Desktop    98 (65%)     │  New          12 (8%)        │
│  ████████████████░░░░    │  █████░░░░░░░░░░░░░░        │
│                          │                              │
│  Mobile     42 (28%)     │  Recognized   85 (56%)       │
│  ███████████░░░░░░░░     │  ████████████████░░░░       │
│                          │                              │
│  Tablet     12 (8%)      │  Trusted      55 (36%)       │
│  ███░░░░░░░░░░░░░░░░     │  █████████████░░░░░░░       │
└──────────────────────────┴──────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  🌍 Geographic Distribution (Top 10)                       │
├────────────────────────────────────────────────────────────┤
│  📍 United States     45 sessions  │  📍 Canada      12    │
│  📍 United Kingdom    23 sessions  │  📍 Australia   10    │
│  📍 Germany           18 sessions  │  📍 France       8    │
│  📍 Japan             15 sessions  │  📍 Brazil       6    │
│  📍 Spain             14 sessions  │  📍 Italy        5    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  📈 Activity Breakdown (Last 7 Days)                       │
├────────────────────────────────────────────────────────────┤
│  page_view                                          12,543 │
│  api_call                                            8,234 │
│  login                                               1,456 │
│  logout                                                892 │
│  session_refresh                                       654 │
│  failed_login                                          123 │
│  session_revoked                                        45 │
│  suspicious_activity                                    12 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ⚠️ Suspicious Sessions (Last 7 Days)                      │
├────────────────────────────────────────────────────────────┤
│  ⚠️ Jane Smith (jane@example.com)                         │
│     iPhone 14 • London, United Kingdom                     │
│     Oct 25, 2025 2:15 PM                                   │
│                                                             │
│  ⚠️ Michael Chen (michael@example.com)                    │
│     Chrome on Windows • Tokyo, Japan                       │
│     Oct 25, 2025 1:30 PM                                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  🕐 Recent Activity (Last 24h)                             │
├────────────────────────────────────────────────────────────┤
│  📄 Page View                                     2:45 PM  │
│     John Doe        /dashboard                             │
│                                                             │
│  🔌 Api Call                                      2:44 PM  │
│     Jane Smith      /api/user/sessions                     │
│                                                             │
│  ✅ Login                                         2:30 PM  │
│     Bob Wilson                                             │
│                                                             │
│  🚪 Logout                                        2:15 PM  │
│     Alice Johnson                                          │
│                                                             │
│  ⚠️ Failed Login                                  2:10 PM  │
│     Unknown         /login                                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  🛡️ Security Monitoring Active                            │
│                                                             │
│  This page displays real-time system-wide session data.    │
│  Suspicious activity is automatically flagged based on     │
│  login patterns, geographic anomalies, and device changes. │
│  Regular monitoring helps maintain account security across │
│  all users.                                                │
└────────────────────────────────────────────────────────────┘
```

## 🎯 Key Interactive Elements

### 1. **Search Bar** 🔍
```
┌─────────────────────────────────────┐
│ 🔍 Search users...                  │
└─────────────────────────────────────┘
```
- Type any part of name or email
- Results filter instantly
- Case-insensitive
- No need to press Enter

### 2. **Filter Dropdowns** 🎚️
```
┌──────────────┐  ┌──────────────┐
│ All Roles  ▼ │  │ All Risk   ▼ │
│──────────────│  │──────────────│
│ All Roles    │  │ All Risk     │
│ Owner        │  │ High Risk    │
│ Admin        │  │ Low Risk     │
│ Moderator    │  │              │
│ Staff        │  │              │
│ User         │  │              │
└──────────────┘  └──────────────┘
```

### 3. **Sort Buttons** 📊
```
Sort by:  [Name]  [Sessions]  [Risk]
          ─────   ─────────   ──────
          (Active)
```
- Click to change sorting
- Active button highlighted in blue
- Instant re-sorting

### 4. **Action Buttons** ⚡
```
┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐
│ 🔄 Refresh   │  │ 📥 Export    │  │ 🔒 Revoke (3)       │
└──────────────┘  └──────────────┘  └─────────────────────┘
```

### 5. **User Row** 👤
```
┌──────────────────────────────────────────────────────┐
│  John Doe                         2        0     👁️  │
│  john@example.com              Sessions  Susp.       │
│  [USER] Last: Oct 25                                 │
│                                   Risk: 15 🟢        │
└──────────────────────────────────────────────────────┘
```
- Click 👁️ to view detailed sessions
- Color-coded risk score
- Hover for highlights

### 6. **Threat Card** 🚨
```
┌──────────────────────────────────────────┐
│  🔴 Location Anomaly                     │
│  User logged in from 2 countries         │
│  within 5 minutes (impossible travel)    │
│                                           │
│  1 user affected • 45m ago               │
│                                           │
│  [🔍 Investigate] [🔒 Block] [✅ Resolve]│
└──────────────────────────────────────────┘
```

### 7. **Timeline Event** 📅
```
┌──────────────────────────────────────┐
│  ✅ Successful login          5m ago │
│     john@example.com                 │
│     📍 San Francisco, US             │
│     💻 Chrome on macOS              │
└──────────────────────────────────────┘
```

## 🎨 Color Coding Guide

### Risk Scores
- **0-24** 🟢 Green = Low Risk (safe)
- **25-49** 🟡 Yellow = Medium Risk (watch)
- **50-69** 🟠 Orange = High Risk (action needed)
- **70-100** 🔴 Red = Critical Risk (urgent)

### Threat Severity
- 🔴 **Critical** - Red background, urgent action
- 🟠 **High** - Orange background, action recommended
- 🟡 **Medium** - Yellow background, monitor
- 🔵 **Low** - Blue background, informational

### Event Types
- ✅ **Login** - Green icon
- 🚪 **Logout** - Gray icon
- ⚠️ **Suspicious** - Red icon
- 🔒 **Revoked** - Orange icon
- 📡 **Activity** - Blue icon

## 🖱️ Common Actions

### Finding a Specific User
1. Click the search bar at the top
2. Type the user's name or email
3. Results appear instantly
4. Click the 👁️ icon to view their sessions

### Investigating Suspicious Activity
1. Look at the "Suspicious" stat card (top right)
2. If > 0, check the Threat Detection Panel
3. Click "Investigate" on any threat
4. Review affected users in the main list
5. Take action (revoke, resolve, etc.)

### Exporting Data
1. Click the "Export" button (top right)
2. File downloads automatically
3. Open in Excel/Sheets
4. Contains all visible users with their stats

### Bulk Revoking Suspicious Sessions
1. When suspicious sessions exist, button appears
2. Click "Revoke Suspicious (X)"
3. Confirm in the dialog
4. All suspicious sessions terminated
5. Users will be logged out

### Monitoring Real-time Activity
1. Watch the "Live Activity Timeline" panel
2. New events appear every 10 seconds
3. Look for suspicious patterns
4. Cross-reference with threat panel

## 📱 Mobile View

On smaller screens, the layout adapts:
```
┌──────────────────────┐
│  Session Analytics   │
├──────────────────────┤
│  📊 152              │
│  Active Sessions     │
├──────────────────────┤
│  👥 48               │
│  Active Users        │
├──────────────────────┤
│  📈 89               │
│  Logins (24h)        │
├──────────────────────┤
│  ⚠️ 3                │
│  Suspicious          │
├──────────────────────┤
│  Search & Filters    │
├──────────────────────┤
│  User List           │
├──────────────────────┤
│  Threat Detection    │
├──────────────────────┤
│  Activity Timeline   │
├──────────────────────┤
│  Analytics           │
└──────────────────────┘
```

## 🌙 Dark Mode

All components support dark mode:
- Darker backgrounds
- Lighter text
- Adjusted colors for readability
- Automatic based on system preference

## ⌨️ Keyboard Shortcuts

### Navigation
- `Tab` - Move between controls
- `Enter` - Activate buttons
- `Esc` - Close dialogs
- `/` - Focus search bar

### Accessibility
- Screen reader friendly
- ARIA labels on all controls
- Keyboard-only navigation supported
- Focus indicators visible

## 💡 Tips & Tricks

### Efficiency Tips
1. **Use filters first** - Narrow down before searching
2. **Sort by risk** - Find problems quickly
3. **Watch the trends** - "+12%" shows growth
4. **Check timeline hourly** - Stay informed
5. **Export weekly** - Build historical data

### Security Tips
1. **Monitor suspicious count** - Should be near 0
2. **Investigate "Investigating" status** - Don't leave pending
3. **Trust the risk scores** - They're calculated from patterns
4. **Watch for VPNs** - May be legitimate or suspicious
5. **Check impossible travel** - High priority threat

### Performance Tips
1. **Use auto-refresh** - No need to manually refresh
2. **Filter by role first** - Reduces list size
3. **Export filtered data** - Only what you need
4. **Close unused tabs** - Reduces polling load

## 🎓 Training Checklist

For new admins:
- [ ] Understand the four stat cards
- [ ] Know how to search for users
- [ ] Can filter by role and risk
- [ ] Understand risk score colors
- [ ] Can use threat detection panel
- [ ] Can interpret activity timeline
- [ ] Know how to export data
- [ ] Can revoke suspicious sessions
- [ ] Understand different threat types
- [ ] Can navigate detailed analytics

## 📞 Quick Reference

### When You See...

| Indicator | Meaning | Action |
|-----------|---------|--------|
| 🔴 Red Border | Critical threat | Investigate immediately |
| Risk > 70 | High-risk user | Review their sessions |
| +50% trend | Unusual growth | Check for attack |
| Multiple failed logins | Possible brute force | Consider blocking IP |
| Impossible travel | Account takeover | Revoke sessions |
| VPN detected | Possible evasion | Verify legitimacy |

## 🎯 Success Metrics

You're doing great if:
- ✅ Suspicious count stays at 0
- ✅ All threats are resolved
- ✅ Risk scores mostly green
- ✅ No critical threats
- ✅ Clean activity timeline
- ✅ Regular exports done
- ✅ All users accounted for

---

**This visual guide shows the complete admin sessions experience!**

The page is now a powerful, intuitive security monitoring dashboard that makes it easy to protect your users and maintain system security. 🛡️

