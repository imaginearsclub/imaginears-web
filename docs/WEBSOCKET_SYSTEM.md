# WebSocket System - Boilerplate & Setup Guide

## 🎯 **Overview**

A modular, feature-flag-driven WebSocket foundation for real-time communication between your website, Minecraft server, and Discord bot.

**Current Status**: ⏸️ **Ready to Enable** (Boilerplate Complete)

---

## 📦 **What's Included**

### **1. Event Type System** (`lib/websocket-events.ts`)
- ✅ Strongly-typed event definitions
- ✅ Client → Server events
- ✅ Server → Client events  
- ✅ Channel-based subscriptions
- ✅ Feature flags for each system

**Supported Event Types**:
- 🔔 Notifications (new, read, count)
- 🎮 Minecraft (players, chat, server status)
- 💬 Discord (messages, members)
- 🚨 System (maintenance, announcements)
- 📊 Live Data (real-time updates)

### **2. Server-Side Utilities** (`lib/websocket-server.ts`)
- ✅ Client connection management
- ✅ Channel subscriptions
- ✅ Broadcasting functions
- ✅ Feature flag enforcement
- ✅ Cleanup utilities

### **3. Client-Side Hook** (`hooks/useWebSocket.ts`)
- ✅ React hook for WebSocket connections
- ✅ Auto-reconnection logic
- ✅ Channel subscription management
- ✅ Type-safe message handling
- ✅ Connection state management

### **4. Notification Integration** (`lib/notifications.ts`)
- ✅ Auto-broadcast on notification creation
- ✅ Feature-flag controlled
- ✅ Ready to send real-time notifications

---

## 🚀 **How to Enable**

### **Step 1: Choose a WebSocket Solution**

Pick one of these options:

#### **Option A: Socket.IO** (Recommended - Easy)
```bash
npm install socket.io socket.io-client
```

#### **Option B: Pusher** (Managed Service - No server needed)
```bash
npm install pusher pusher-js
```
Sign up at https://pusher.com

#### **Option C: Ably** (Managed Service - Free tier)
```bash
npm install ably
```
Sign up at https://ably.com

#### **Option D: Native WebSocket** (Advanced - Full control)
Create a custom WebSocket server in a separate Node.js process.

---

### **Step 2: Set Environment Variables**

Add to your `.env` file:

```bash
# WebSocket Server URL
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3002"

# Feature Flags (enable what you need)
ENABLE_REALTIME_NOTIFICATIONS="true"
ENABLE_MINECRAFT_EVENTS="false"
ENABLE_DISCORD_EVENTS="false"
```

---

### **Step 3: Implement WebSocket Server**

#### **Example: Using Socket.IO**

Create `server/websocket-server.js`:

```javascript
const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_SITE_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Handle client events
  socket.on("client:subscribe", ({ channels }) => {
    channels.forEach((channel) => {
      socket.join(channel);
      console.log(`Client ${socket.id} subscribed to ${channel}`);
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(3002, () => {
  console.log("WebSocket server running on port 3002");
});
```

Run it:
```bash
node server/websocket-server.js
```

---

### **Step 4: Update Client Hook**

In `hooks/useWebSocket.ts`, uncomment the WebSocket initialization:

```typescript
// Around line 60, uncomment this section:
wsRef.current = new WebSocket(url);

wsRef.current.onopen = () => {
  // ... (uncomment all the connection logic)
};
```

---

### **Step 5: Use in Components**

```typescript
"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { CHANNELS } from "@/lib/websocket-events";
import { toast } from "@/components/common";

export function MyComponent() {
  const { isConnected, connectionState } = useWebSocket({
    enabled: true,
    channels: [CHANNELS.NOTIFICATIONS],
    onMessage: (message) => {
      // Handle real-time messages
      if (message.type === "notification:new") {
        toast.info(message.data.title, {
          message: message.data.message,
        });
      }
    },
  });

  return (
    <div>
      Status: {connectionState}
    </div>
  );
}
```

---

## 🎮 **Minecraft Integration**

When ready to connect Minecraft events:

1. **Enable the feature**:
   ```bash
   ENABLE_MINECRAFT_EVENTS="true"
   ```

2. **Send events from Minecraft plugin**:
   ```javascript
   // In your Minecraft plugin (Java):
   // Use HTTP webhook or direct WebSocket connection
   
   POST https://your-site.com/api/minecraft/event
   {
     "type": "minecraft:player:join",
     "data": {
       "username": "Steve",
       "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5"
     }
   }
   ```

3. **Broadcast to clients**:
   ```typescript
   // In your API route:
   import { broadcast, CHANNELS } from "@/lib/websocket-server";
   
   broadcast("minecraft:player:join", {
     username: "Steve",
     uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
     timestamp: Date.now(),
   }, {
     channel: CHANNELS.MINECRAFT_PLAYERS,
   });
   ```

---

## 💬 **Discord Integration**

When ready to connect Discord bot:

1. **Enable the feature**:
   ```bash
   ENABLE_DISCORD_EVENTS="true"
   ```

2. **Forward Discord events**:
   ```javascript
   // In your Discord bot:
   client.on('messageCreate', async (message) => {
     await fetch('https://your-site.com/api/discord/message', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         channelId: message.channel.id,
         author: message.author.username,
         content: message.content,
         timestamp: Date.now(),
       }),
     });
   });
   ```

3. **Broadcast to website**:
   ```typescript
   // In your API route:
   broadcast("discord:message", {
     channelId: data.channelId,
     author: data.author,
     content: data.content,
     timestamp: data.timestamp,
   }, {
     channel: CHANNELS.DISCORD_MESSAGES,
   });
   ```

---

## 📊 **Event Types Reference**

### **Notifications**
- `notification:new` - New notification created
- `notification:read` - Notification marked as read
- `notification:archived` - Notification archived
- `notification:count` - Unread count update

### **Minecraft**
- `minecraft:player:join` - Player joined server
- `minecraft:player:leave` - Player left server
- `minecraft:player:count` - Player count update
- `minecraft:server:status` - Server online/offline
- `minecraft:chat` - Chat message

### **Discord**
- `discord:message` - New message in Discord
- `discord:member:join` - Member joined server
- `discord:member:leave` - Member left server

### **System**
- `system:maintenance` - Maintenance scheduled/started
- `system:announcement` - Important announcement
- `system:update` - System version update

---

## 🔧 **Testing**

### **Test Without Real WebSocket** (Current State)

The system includes mock connections for UI testing:

```typescript
// Notifications automatically work with 30s polling
// Toast system works immediately
// UI shows connection status (will show "connected" in mock mode)
```

### **Test With Real WebSocket**

1. Start WebSocket server
2. Enable in environment
3. Uncomment hook code
4. Test with browser DevTools Network tab

---

## 🎯 **Next Steps**

**To fully enable real-time features:**

1. ✅ Choose WebSocket solution (Socket.IO/Pusher/Ably)
2. ⏳ Set up WebSocket server
3. ⏳ Update environment variables
4. ⏳ Uncomment client hook code
5. ⏳ Test connection
6. ⏳ Enable feature flags one by one
7. ⏳ Integrate Minecraft plugin
8. ⏳ Integrate Discord bot

**Everything is ready to go - just flip the switches when you're ready!** 🚀

---

## 📖 **Additional Resources**

- Socket.IO Docs: https://socket.io/docs/v4/
- Pusher Docs: https://pusher.com/docs/
- Ably Docs: https://ably.com/docs/
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

## 🐛 **Troubleshooting**

**Connection fails?**
- Check NEXT_PUBLIC_WEBSOCKET_URL is correct
- Verify WebSocket server is running
- Check CORS settings

**Features not working?**
- Verify feature flags in `.env`
- Check server-side feature flag enforcement
- Review browser console for errors

**Minecraft events not showing?**
- Confirm ENABLE_MINECRAFT_EVENTS="true"
- Verify plugin is sending requests
- Check API route logs

