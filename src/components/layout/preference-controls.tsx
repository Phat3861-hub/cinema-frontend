"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLocale, useT } from "@/i18n";

const BUTTON =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line px-2.5 " +
  "text-sm font-semibold text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg " +
  "focus-visible:outline-2 focus-visible:outline-accent";

/** Sun / moon switch between the light and dark theme. */
export function ThemeToggle() {
  const t = useT();
  const { theme, toggle } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? t.preferences.toLight : t.preferences.toDark;
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={`${BUTTON} w-10`}>
      <Icon aria-hidden className="size-5" />
    </button>
  );
}

/** VI / EN switch; shows the language the click will switch to. */
export function LocaleSwitcher() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const next = locale === "vi" ? "en" : "vi";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t.preferences.switchLanguage}
      title={t.preferences.switchLanguage}
      className={BUTTON}
    >
      <Languages aria-hidden className="size-4" />
      <span lang={next}>{next.toUpperCase()}</span>
    </button>
  );
}

export function PreferenceControls() {
  return (
    <div className="flex items-center gap-2">
      <LocaleSwitcher />
      <ThemeToggle />
    </div>
  );
}
