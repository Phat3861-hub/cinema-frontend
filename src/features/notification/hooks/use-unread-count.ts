"use client";

import { useEffect, useState } from "react";
import { notificationApi } from "@/features/notification/api";

const POLL_MS = 60_000;
/** Focus and visibilitychange usually fire together when the tab comes back; one request is enough. */
const MIN_GAP_MS = 5_000;
const CHANGED_EVENT = "notifications:changed";

/** Tells every bell / list on the page to reload (after marking read). */
export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Runs `listener` when another component marks notifications read. */
export function useNotificationsChanged(listener: () => void) {
  useEffect(() => {
    window.addEventListener(CHANGED_EVENT, listener);
    return () => window.removeEventListener(CHANGED_EVENT, listener);
  }, [listener]);
}

/**
 * Unread notification count for the bell badge: polled every minute while the tab is visible, and refreshed when the
 * tab regains focus or a notification is marked read. `enabled = false` (signed out) answers 0 without requests.
 */
export function useUnreadCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let lastLoad = 0;

    function load(force = false) {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (!force && now - lastLoad < MIN_GAP_MS) return;
      lastLoad = now;
      notificationApi.unreadCount().then(
        (result) => !cancelled && setCount(result.count),
        () => undefined,
      );
    }

    const onFocus = () => load();
    const onVisible = () => document.visibilityState === "visible" && load();
    const onChanged = () => load(true);
    load(true);
    const timer = setInterval(() => load(true), POLL_MS);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(CHANGED_EVENT, onChanged);
    };
  }, [enabled]);

  return enabled ? count : 0;
}
