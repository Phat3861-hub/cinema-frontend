"use client";

import { Client } from "@stomp/stompjs";
import { useEffect, useRef } from "react";
import type { ShowtimeSeatStatus } from "@/features/showtime/types";
import { env } from "@/lib/env";

/** Payload of `/topic/showtimes/{id}/seats` (backend SeatStatusChanged); `seatIds` are room seat ids. */
export interface SeatStatusChange {
  showtimeId: number;
  seatIds: number[];
  status: ShowtimeSeatStatus;
}

const RECONNECT_DELAY_MS = 5_000;

/** `env.wsUrl` is written as http(s); the backend endpoint is a plain WebSocket (no SockJS). */
function brokerUrl(): string {
  return env.wsUrl.replace(/^http/, "ws");
}

/**
 * Live seat status of one showtime over STOMP. Reconnects by itself; after a reconnect `onResync` runs so the
 * caller can reload the snapshot (changes sent while offline are lost).
 */
export function useSeatUpdates(
  showtimeId: number | string,
  onChange: (change: SeatStatusChange) => void,
  onResync?: () => void,
) {
  const handlers = useRef({ onChange, onResync });
  useEffect(() => {
    handlers.current = { onChange, onResync };
  });

  useEffect(() => {
    let connectedBefore = false;
    const client = new Client({
      brokerURL: brokerUrl(),
      reconnectDelay: RECONNECT_DELAY_MS,
      onConnect: () => {
        client.subscribe(`/topic/showtimes/${showtimeId}/seats`, (message) => {
          handlers.current.onChange(JSON.parse(message.body) as SeatStatusChange);
        });
        if (connectedBefore) handlers.current.onResync?.();
        connectedBefore = true;
      },
    });
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [showtimeId]);
}
