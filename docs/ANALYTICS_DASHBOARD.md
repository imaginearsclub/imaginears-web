# Analytics Dashboard System

## ✅ Status: **FULLY OPERATIONAL**

**Last Successful Sync**: 1,266 players synced | 1 account linked | 0 errors  
**Integration**: Plan Player Analytics (Cookie-based auth) ✅  
**API Status**: Authenticated and functional ✅

---

## 🎯 Overview

The Analytics Dashboard provides comprehensive insights into your platform's performance, including web traffic, player engagement, event performance, and more. It includes deep integration with Plan Player Analytics for a unified view of player activity across both web and Minecraft server.

## 📊 Features

### 1. **Web Analytics**
- **Page Views**: Track daily page views with beautiful charts
- **Unique Visitors**: Count unique users visiting your site
- **Top Pages**: See which pages are most popular
- **Device Breakdown**: Mobile, desktop, and tablet usage statistics
- **Referrer Tracking**: See where visitors come from

### 2. **Player Analytics**
- **Active Players**: Track currently active players (last 30 days)
- **Engagement Scores**: Web + Minecraft combined engagement metrics
- **Top Players**: Leaderboard by playtime
- **Player Retention**: Cohort analysis and retention rates
- **Activity Trends**: Historical player activity data

### 3. **Event Analytics**
- **Event Views**: Track how many people view each event
- **Unique Visitors**: Count unique visitors per event
- **Engagement Metrics**: Clicks, favorites, shares
- **Attendance Tracking**: Compare expected vs actual attendance (future)
- **Category Performance**: Compare different event categories

### 4. **Minecraft Integration**
- **Player Sync**: Automatic sync from Player Analytics Plugin
- **Playtime Tracking**: Total playtime per player
- **Session Counts**: Total join counts
- **Account Linking**: Link Minecraft accounts to website users
- **Unified Dashboard**: See both web and MC data in one place

## 🚀 Getting Started

### Access the Dashboard

1. Navigate to **Admin > Analytics** in the sidebar
2. Required permission: `analytics:read`
3. Available to: **OWNER**, **ADMIN**, **MODERATOR** roles

### Understanding the Dashboard

#### Tabs Overview

**1. Overview Tab**
- High-level KPIs (Page Views, Unique Visitors, Active Players)
- Page views chart (time series)
- Device breakdown (pie chart)
- Top pages (bar chart)

**2. Players Tab**
- Top players by playtime
- Recently active players
- Engagement scores
- Player retention metrics

**3. Events Tab**
- Top events by views
- Event performance comparison
- Detailed metrics (views, clicks, favorites)

**4. Web Traffic Tab**
- Daily page views (line chart)
- Most visited pages
- Detailed traffic breakdown

#### Time Period Selector

Choose from:
- **Today**: Current day only
- **Last 7 Days**: Weekly view
- **Last 30 Days**: Monthly view
- **Last 90 Days**: Quarterly view
- **Last Year**: Annual view

## 🔗 Minecraft Player Analytics Integration

You have **3 ways** to sync player data from your Minecraft server:

### **Method 1: Plan API Sync (Recommended)**

The easiest and most reliable method. Pulls data directly from **Plan Player Analytics** using cookie-based authentication.

**Plugin:** [Plan Player Analytics](https://github.com/plan-player-analytics/Plan) - The industry standard for Minecraft analytics.

#### Setup:

1. **Create a Plan Web User:**

In-game or console, run:
```
/plan register <username> <password>
```

Or use an existing Minecraft account with Plan web permissions.

2. **Add to your `.env`:**

```bash
# Plan Player Analytics (Cookie-based Authentication)
PLAN_API_URL=https://your-server.com:8804
PLAN_USERNAME=your-plan-web-username
PLAN_PASSWORD=your-plan-web-password
PLAN_SERVER_IDENTIFIER=Server 1  # Optional - uses /v1/server/{identifier}/playersTable
                                  # If omitted, uses /v1/playersTable (network-wide or single server)
```

3. **Common Plan URLs:**
   - **Single Server**: `https://your-server.com:8804` (default Plan port, leave SERVER_IDENTIFIER empty)
   - **Behind Proxy**: `https://your-domain.com/plan`
   - **BungeeCord/Velocity Network**: Use the network Plan address and optionally specify server identifier

4. **Test & Sync:**
   - Go to **Admin > Analytics > Players Tab**
   - Click **"Test Connection"** to verify setup (tests authentication)
   - Click **"Sync Now"** to pull player data

5. **(Optional) Set up automatic sync:**
   - Use a cron job to call: `POST /api/minecraft/sync`
   - Or use your server's task scheduler
   - Recommended: Every 1-6 hours

#### How It Works:
- Uses **cookie-based authentication** (Set-Cookie header)
- Sessions are cached and auto-renewed (23-hour lifespan)
- Authenticates once, then reuses session for subsequent requests
- If session expires, automatically re-authenticates

#### Advantages:
- ✅ Most reliable (you control when it syncs)
- ✅ Easy to test and debug
- ✅ Works with Plan's standard authentication
- ✅ Can sync on-demand from admin panel
- ✅ Session management handled automatically

---

### **Method 2: Webhooks (Real-time)**

Get real-time updates when players join/leave.

#### Setup:

1. **Add to your `.env`:**

```bash
# Minecraft Webhook
MINECRAFT_WEBHOOK_SECRET=your-secure-secret-here
```

2. **Configure your plugin to send webhooks to:**

```
https://your-domain.com/api/minecraft/analytics
```

3. **Add webhook secret to your plugin config:**

```yaml
webhook:
  enabled: true
  url: "https://your-domain.com/api/minecraft/analytics"
  secret: "your-secure-secret-here"
  events:
    - player_join
    - player_leave
    - bulk_sync
```

#### Advantages:
- ✅ Real-time updates
- ✅ No manual syncing needed
- ⚠️ Requires plugin support for webhooks

---

### **Method 3: Manual Upload (Fallback)

If neither API nor webhooks are available:

1. **Export CSV from Player Analytics Plugin**
2. **Use the bulk upload API:**

```bash
curl -X POST https://your-domain.com/api/minecraft/analytics \
  -H "Content-Type: application/json" \
  -H "X-Minecraft-Secret: your-secret-here" \
  -d '{
    "event": "bulk_sync",
    "timestamp": "2025-10-26T12:00:00Z",
    "server": "imaginears-main",
    "data": [
      {
        "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
        "name": "Notch",
        "playtime": 12000,
        "sessions": 150,
        "lastSeen": "2025-10-26T12:00:00Z",
        "firstJoin": "2023-01-01T00:00:00Z"
      }
    ]
  }'
```

---

### **Recommended Approach**

Use **Method 1 (Plan API)** + **Method 2 (Webhooks)** together:
- **API Sync**: Run every 6 hours for bulk updates and historical data
- **Webhooks**: Get real-time notifications for player joins/leaves
- **Result**: Best of both worlds - historical accuracy + real-time updates!

### **Troubleshooting Plan Integration**

If you're having issues connecting to Plan:

1. **Check Plan is Running:**
   ```
   /plan info
   ```

2. **Verify Port Access:**
   - Default port: `8804`
   - Check firewall rules
   - Check server security groups (if cloud hosting)

3. **Test Plan Web Panel Manually:**
   - Open `https://your-server.com:8804` in browser
   - Log in with your credentials
   - If this works, the API should work too

4. **Check Plan Logs:**
   - Located in: `plugins/Plan/logs/`
   - Look for authentication errors

5. **CORS Issues (if on different domain):**
   
   Edit `plugins/Plan/config.yml`:
   ```yaml
   Webserver:
     Security:
       CORS:
         Allow_origin: "https://your-website-domain.com"
   ```

6. **Alternative IP Setup (if using proxy):**
   
   Edit `plugins/Plan/config.yml`:
   ```yaml
   Webserver:
     Alternative_IP:
       Enabled: true
       Link: "https://your-domain.com/plan"
   ```

### **Linking Players to Website Accounts**

Players with matching Minecraft usernames are **automatically linked** when synced. 

The system matches:
- Minecraft UUID → Database UUID
- Minecraft Username → Website Username (case-insensitive)

Manual linking interface coming soon!

## 📈 Analytics API Endpoints

### `GET /api/analytics/overview`

Get overview analytics data.

**Query Parameters:**
- `period` (optional): `today` | `week` | `month` | `quarter` | `year` (default: `week`)

**Response:**
```json
{
  "period": "week",
  "startDate": "2025-10-19T00:00:00Z",
  "endDate": "2025-10-26T00:00:00Z",
  "pageViews": [
    { "date": "2025-10-19", "views": 145 },
    { "date": "2025-10-20", "views": 203 }
  ],
  "uniqueVisitors": 87,
  "topPages": [
    { "path": "/events", "views": 450 },
    { "path": "/apply", "views": 230 }
  ],
  "deviceBreakdown": [
    { "deviceType": "mobile", "count": 450 },
    { "deviceType": "desktop", "count": 320 }
  ],
  "activePlayers": 42
}
```

### `GET /api/analytics/players`

Get player analytics data.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: `30`)

**Response:**
```json
{
  "activePlayers": [
    {
      "id": "...",
      "minecraftName": "Notch",
      "totalWebVisits": 45,
      "totalMinecraftTime": 12000,
      "totalMinecraftJoins": 150,
      "overallEngagement": 85.5,
      "lastActiveAt": "2025-10-26T12:00:00Z"
    }
  ],
  "retention": {
    "2023-01": {
      "total": 100,
      "active": 45,
      "retention": 45.0
    }
  },
  "topPlayers": [
    {
      "minecraftName": "Notch",
      "totalMinecraftTime": 12000,
      "totalMinecraftJoins": 150
    }
  ]
}
```

### `GET /api/analytics/events`

Get event analytics data.

**Query Parameters:**
- `limit` (optional): Number of events to return (default: `10`)

**Response:**
```json
{
  "topEvents": [
    {
      "eventId": "...",
      "eventTitle": "Fireworks Show",
      "category": "Fireworks",
      "startAt": "2025-10-30T20:00:00Z",
      "totalViews": 450,
      "uniqueVisitors": 230,
      "totalClicks": 89,
      "favoriteCount": 45
    }
  ]
}
```

### `POST /api/analytics/track`

Track custom analytics events (used by client-side tracking).

**Request Body:**
```json
{
  "type": "page_view",
  "path": "/events",
  "deviceType": "mobile",
  "browser": "Chrome",
  "os": "Windows",
  "duration": 5000
}
```

### `POST /api/minecraft/analytics`

Webhook endpoint for Minecraft Player Analytics Plugin.

**Headers:**
- `X-Minecraft-Secret`: Your webhook secret

**Request Body:**
```json
{
  "event": "bulk_sync",
  "timestamp": "2025-10-26T12:00:00Z",
  "server": "imaginears-main",
  "data": [
    {
      "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
      "name": "Notch",
      "playtime": 12000,
      "sessions": 150,
      "lastSeen": "2025-10-26T12:00:00Z",
      "firstJoin": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### `POST /api/minecraft/sync`

Manually sync player data from Player Analytics Web API.

**Authentication**: Required (analytics:read permission)

**Response:**
```json
{
  "success": true,
  "synced": 150,
  "errors": 0,
  "linked": 45,
  "message": "Successfully synced 150 players (45 linked to accounts)"
}
```

### `GET /api/minecraft/sync/test`

Test connection to Player Analytics Web API.

**Authentication**: Required (analytics:read permission)

**Response:**
```json
{
  "success": true,
  "message": "API connection successful",
  "playerCount": 150
}
```

## 🔐 Permissions

Analytics permissions are automatically granted to:

| Role       | `analytics:read` | `analytics:export` |
|------------|------------------|--------------------|
| OWNER      | ✅               | ✅                 |
| ADMIN      | ✅               | ✅                 |
| MODERATOR  | ✅               | ❌                 |
| STAFF      | ❌               | ❌                 |
| USER       | ❌               | ❌                 |

To grant custom roles access, add `analytics:read` to their permissions in **Admin > User Roles > Configure Roles**.

## 📊 Database Schema

### `AnalyticsEvent`
Individual analytics events (page views, clicks, etc.)

### `AnalyticsMetric`
Aggregated metrics for fast dashboard queries

### `PlayerAnalytics`
Combined web + Minecraft player data

### `EventAnalytics`
Event performance tracking

### `ApplicationAnalytics`
Application funnel and conversion metrics

## 🎨 Charts & Visualizations

Built with **Recharts** - a composable charting library:

- **Area Charts**: Page views over time
- **Bar Charts**: Top pages, event comparisons
- **Line Charts**: Daily trends
- **Pie Charts**: Device breakdown

All charts are:
- **Responsive**: Adapt to screen size
- **Themed**: Match your light/dark mode
- **Interactive**: Hover for details
- **Accessible**: ARIA labels and keyboard navigation

## 🔮 Future Enhancements

### Coming Soon
- **Export to CSV**: Download analytics data
- **Scheduled Reports**: Weekly/monthly email digests
- **Custom Dashboards**: Create your own views
- **Alerts**: Get notified of anomalies
- **A/B Testing**: Compare different approaches
- **Conversion Funnels**: Track user journeys
- **Heat Maps**: See where users click

### Integration Ideas
- **Discord Bot**: Send daily stats to Discord
- **Slack Integration**: Post reports to Slack
- **Google Analytics**: Export to GA for advanced analysis
- **Data Studio**: Connect to Google Data Studio

## 🛠️ Troubleshooting

### Minecraft Data Not Syncing

**✅ RESOLVED**: Cookie-based authentication with Plan API is now working correctly.

Common issues and solutions:
1. **404 errors**: Ensure you're using the correct endpoint (`/v1/playersTable`)
2. **Authentication fails**: Verify `PLAN_USERNAME` and `PLAN_PASSWORD` are correct
3. **No players returned**: Check that Plan has player data (visit the Plan web UI)
4. **Prisma errors**: Run `npx prisma generate` after schema changes

### No Analytics Data Showing

1. **Wait for data**: Analytics need user activity to populate
2. **Check permissions**: Ensure you have `analytics:read` permission
3. **Verify time period**: Try selecting "Last 30 Days" instead of "Today"

### Charts Not Rendering

1. **Check browser console**: Look for JavaScript errors
2. **Update dependencies**: Run `npm install` to ensure Recharts is installed
3. **Clear cache**: Try hard refresh (Ctrl+Shift+R)

## 📚 Related Documentation

- [Session Management](./ENHANCED_SESSION_MANAGEMENT.md) - Session tracking and security
- [RBAC System](./RBAC_SYSTEM.md) - Permissions and access control
- [API Documentation](./API_KEYS.md) - API keys and authentication
- [Player Analytics Plugin Docs](https://github.com/plan-player-analytics/Plan/wiki) - External plugin docs

## 💡 Tips & Best Practices

1. **Check analytics daily**: Stay on top of trends
2. **Compare periods**: Use different time ranges to spot patterns
3. **Link Minecraft accounts**: Better insights when web + MC data is linked
4. **Export regularly**: Backup your data
5. **Monitor engagement**: Use scores to identify at-risk players
6. **Track events**: See which events resonate with your audience

---

**Built with ❤️ for Imaginears**

