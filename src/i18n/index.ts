"use client";

import { useSyncExternalStore } from "react";
import { en } from "@/i18n/messages/en";
import { vi, type Messages } from "@/i18n/messages/vi";
import { DEFAULT_LOCALE, LOCALE_COOKIE, writeCookie, type Locale } from "@/lib/preferences";

export type { Messages };

const MESSAGES: Record<Locale, Messages> = { vi, en };

/** BCP 47 tag for Intl formatters: en-GB keeps dd/MM/yyyy and the 24-hour clock like vi-VN. */
export const INTL_LOCALE: Record<Locale, string> = { vi: "vi-VN", en: "en-GB" };

const listeners = new Set<() => void>();

function current(): Locale {
  return document.documentElement.lang === "en" ? "en" : "vi";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Current UI language (cookie `locale`, applied to <html lang> before paint). The server renders the default
 * (Vietnamese); after hydration React re-renders with the stored language.
 */
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, current, () => DEFAULT_LOCALE);

  function setLocale(next: Locale) {
    document.documentElement.lang = next;
    writeCookie(LOCALE_COOKIE, next);
    listeners.forEach((listener) => listener());
  }

  return { locale, intlLocale: INTL_LOCALE[locale], setLocale };
}

/** Messages of the current language: `const t = useT(); t.auth.login.title`. */
export function useT(): Messages {
  return MESSAGES[useLocale().locale];
}

// Only plain-string leaves: functions (interpolation) and arrays (FAQ items) are not addressable by id.
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[] | ((...args: never[]) => unknown)
      ? never
      : T[K] extends object
        ? Leaves<T[K], `${P}${K}.`>
        : never;
}[keyof T & string];

/** Dotted path of a plain-string message, e.g. "auth.login.title" (for server components, via <Msg>). */
export type MessageId = Leaves<Messages>;

export function lookup(messages: Messages, id: MessageId): string {
  let node: unknown = messages;
  for (const part of id.split(".")) node = (node as Record<string, unknown>)[part];
  return typeof node === "string" ? node : id;
}
