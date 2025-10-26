"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  WebSocketMessage,
  ServerEvents,
  Channel,
  ConnectionInfo,
} from "@/lib/websocket-events";

/**
 * WebSocket Hook Configuration
 */
interface UseWebSocketOptions {
  enabled?: boolean; // Enable/disable WebSocket connection
  url?: string; // WebSocket server URL
  channels?: Channel[]; // Initial channels to subscribe to
  reconnect?: boolean; // Auto-reconnect on disconnect
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: <T extends keyof ServerEvents>(message: WebSocketMessage<T>) => void;
}

/**
 * React Hook for WebSocket Connection
 * 
 * **IMPORTANT**: This is a client-side boilerplate/foundation.
 * To enable:
 * 1. Set up a WebSocket server (or use a service like Pusher/Ably)
 * 2. Set NEXT_PUBLIC_WEBSOCKET_URL environment variable
 * 3. Enable the hook by passing `enabled: true`
 * 
 * @example
 * ```tsx
 * const { connectionState, subscribe, sendMessage } = useWebSocket({
 *   enabled: true,
 *   channels: [CHANNELS.NOTIFICATIONS],
 *   onMessage: (message) => {
 *     if (message.type === "notification:new") {
 *       toast.info(message.data.title);
 *     }
 *   },
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = false, // Disabled by default
    url = process.env['NEXT_PUBLIC_WEBSOCKET_URL'] || "ws://localhost:3002",
    channels = [],
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 3000,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = options;

  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    state: "disconnected",
    reconnectAttempts: 0,
    subscribedChannels: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!enabled) {
      console.log("[useWebSocket] WebSocket is disabled");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[useWebSocket] Already connected");
      return;
    }

    try {
      console.log(`[useWebSocket] Connecting to ${url}...`);
      setConnectionInfo((prev) => ({ ...prev, state: "connecting" }));

      // TODO: Replace with actual WebSocket connection
      // For now, this is a placeholder
      // wsRef.current = new WebSocket(url);

      // Simulate connection for boilerplate
      console.log("[useWebSocket] WebSocket connection is not implemented yet");
      console.log("[useWebSocket] To enable:");
      console.log("  1. Set NEXT_PUBLIC_WEBSOCKET_URL environment variable");
      console.log("  2. Uncomment WebSocket initialization code");
      console.log("  3. Set up a WebSocket server or service");

      // Mock connected state for testing UI
      setTimeout(() => {
        setConnectionInfo({
          state: "connected",
          clientId: "mock-client-id",
          connectedAt: Date.now(),
          lastPingAt: Date.now(),
          reconnectAttempts: 0,
          subscribedChannels: channels,
        });
        onConnect?.();
      }, 1000);

      /* 
      // Uncomment when WebSocket server is ready:

      wsRef.current.onopen = () => {
        console.log("[useWebSocket] Connected");
        setConnectionInfo({
          state: "connected",
          connectedAt: Date.now(),
          lastPingAt: Date.now(),
          reconnectAttempts: 0,
          subscribedChannels: [],
        });

        // Subscribe to initial channels
        if (channels.length > 0) {
          subscribe(channels);
        }

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          sendMessage("client:ping", { timestamp: Date.now() });
        }, 30000);

        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log("[useWebSocket] Message received:", message);

          // Handle internal messages
          if (message.type === "server:connected") {
            setConnectionInfo((prev) => ({
              ...prev,
              clientId: message.data.clientId,
            }));
          }

          if (message.type === "server:pong") {
            setConnectionInfo((prev) => ({
              ...prev,
              lastPingAt: Date.now(),
            }));
          }

          // Pass message to callback
          onMessage?.(message);
        } catch (error) {
          console.error("[useWebSocket] Failed to parse message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("[useWebSocket] Error:", error);
        setConnectionInfo((prev) => ({ ...prev, state: "error" }));
        onError?.(new Error("WebSocket error"));
      };

      wsRef.current.onclose = () => {
        console.log("[useWebSocket] Disconnected");
        setConnectionInfo((prev) => ({ ...prev, state: "disconnected" }));

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt reconnection
        if (reconnect && connectionInfo.reconnectAttempts < maxReconnectAttempts) {
          setConnectionInfo((prev) => ({
            ...prev,
            state: "reconnecting",
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }

        onDisconnect?.();
      };
      */
    } catch (error) {
      console.error("[useWebSocket] Connection failed:", error);
      setConnectionInfo((prev) => ({ ...prev, state: "error" }));
      onError?.(error as Error);
    }
  }, [enabled, url, channels, reconnect, maxReconnectAttempts, reconnectDelay, onConnect, onDisconnect, onError, onMessage, connectionInfo.reconnectAttempts]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionInfo({
      state: "disconnected",
      reconnectAttempts: 0,
      subscribedChannels: [],
    });
  }, []);

  /**
   * Subscribe to channels
   */
  const subscribe = useCallback((channelsToSubscribe: Channel[]) => {
    if (connectionInfo.state !== "connected") {
      console.warn("[useWebSocket] Not connected, cannot subscribe");
      return;
    }

    console.log("[useWebSocket] Subscribing to:", channelsToSubscribe);

    // TODO: Send subscription message to server
    // sendMessage("client:subscribe", { channels: channelsToSubscribe });

    setConnectionInfo((prev) => ({
      ...prev,
      subscribedChannels: [...new Set([...prev.subscribedChannels, ...channelsToSubscribe])],
    }));
  }, [connectionInfo.state]);

  /**
   * Unsubscribe from channels
   */
  const unsubscribe = useCallback((channelsToUnsubscribe: Channel[]) => {
    if (connectionInfo.state !== "connected") {
      console.warn("[useWebSocket] Not connected, cannot unsubscribe");
      return;
    }

    console.log("[useWebSocket] Unsubscribing from:", channelsToUnsubscribe);

    // TODO: Send unsubscription message to server
    // sendMessage("client:unsubscribe", { channels: channelsToUnsubscribe });

    setConnectionInfo((prev) => ({
      ...prev,
      subscribedChannels: prev.subscribedChannels.filter(
        (ch) => !channelsToUnsubscribe.includes(ch)
      ),
    }));
  }, [connectionInfo.state]);

  /**
   * Send message to server
   */
  const sendMessage = useCallback(<T extends keyof any>(type: T, data: any) => {
    if (connectionInfo.state !== "connected" || !wsRef.current) {
      console.warn("[useWebSocket] Not connected, cannot send message");
      return;
    }

    const message = {
      type,
      data,
      timestamp: Date.now(),
    };

    console.log("[useWebSocket] Sending message:", message);

    // TODO: Send message via WebSocket
    // wsRef.current.send(JSON.stringify(message));
  }, [connectionInfo.state]);

  // Auto-connect on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled]); // Only run on enabled change

  return {
    // Connection state
    connectionState: connectionInfo.state,
    connectionInfo,
    isConnected: connectionInfo.state === "connected",
    isConnecting: connectionInfo.state === "connecting",
    isReconnecting: connectionInfo.state === "reconnecting",

    // Methods
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage,
  };
}

