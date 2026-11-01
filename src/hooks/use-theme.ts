"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_COOKIE, writeCookie, type Theme } from "@/lib/preferences";

const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Light / dark theme shared by the customer site and the admin area; the `.dark` class is set before paint. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => DEFAULT_THEME);

  function setTheme(next: Theme) {
    document.documentElement.classList.toggle("dark", next === "dark");
    writeCookie(THEME_COOKIE, next);
    listeners.forEach((listener) => listener());
  }

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
