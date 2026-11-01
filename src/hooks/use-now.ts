"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(listener: () => void) {
  const id = setInterval(listener, MINUTE);
  return () => clearInterval(id);
}

// Rounded to the minute so the snapshot stays stable between ticks.
const snapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** Current time (ms) for render logic such as "is this showtime in the future", refreshed every minute. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
