"use client";

import type { ReactNode } from "react";

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
  count?: number;
}

/**
 * Underlined tab bar (BankDash Transaction / Setting). Used as a filter switch, so it is a group of
 * toggle buttons (`aria-pressed`) rather than an ARIA tablist with panels.
 */
export function Tabs<V extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="-mb-px flex gap-6 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={
              "relative shrink-0 cursor-pointer pb-3 text-sm font-semibold whitespace-nowrap transition-colors " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
              (active ? "text-fg" : "text-fg-muted hover:text-fg")
            }
          >
            {item.label}
            {item.count !== undefined && <span className="ml-1.5 text-xs text-fg-subtle">{item.count}</span>}
            {active && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

/** Pill switch for 2–5 options (e.g. "Now showing / Coming soon" on the customer site). */
export function Segmented<V extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface p-1">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={
              "cursor-pointer rounded px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors " +
              "focus-visible:outline-2 focus-visible:outline-accent " +
              (active ? "bg-primary text-black" : "text-fg-muted hover:text-fg")
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
