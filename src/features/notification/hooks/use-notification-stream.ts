"use client";

import { Client } from "@stomp/stompjs";
import { useEffect } from "react";
import { announceNotificationsChanged } from "@/features/notification/hooks/use-unread-count";
import { env } from "@/lib/env";

const RECONNECT_DELAY_MS = 5_000;

/**
 * Live "you have a new notification" signal over STOMP (`/user/queue/notifications`; the backend knows the user from
 * the access-token cookie sent with the WebSocket handshake). Every message, and every reconnect (pushes sent while
 * offline are lost), tells the bell and the open lists to reload. The one-minute poll of `useUnreadCount` stays as
 * the fallback, so nothing depends on this connection. `userId` null (signed out) opens no connection; a different
 * user reconnects.
 */
export function useNotificationStream(userId: number | null) {
  useEffect(() => {
    if (userId === null) return;
    let connectedBefore = false;
    const client = new Client({
      brokerURL: env.wsUrl.replace(/^http/, "ws"),
      reconnectDelay: RECONNECT_DELAY_MS,
      onConnect: () => {
        client.subscribe("/user/queue/notifications", () => announceNotificationsChanged());
        if (connectedBefore) announceNotificationsChanged();
        connectedBefore = true;
      },
    });
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [userId]);
}
