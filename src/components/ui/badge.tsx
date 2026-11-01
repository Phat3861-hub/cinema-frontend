import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "success" | "danger" | "warning" | "info" | "primary";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-surface-2 text-fg-2",
  accent: "border-accent/40 bg-accent/10 text-accent",
  success: "border-success/40 bg-success/10 text-success",
  danger: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-info/40 bg-info/10 text-info",
  primary: "border-primary bg-primary text-black",
};

/** Small status label; always carries text so meaning never depends on colour alone. */
export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
