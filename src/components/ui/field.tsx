"use client";

import { useId, type ReactNode } from "react";
import { useT } from "@/i18n";

/** Shared input look; `invalid` swaps the border to the danger colour. */
export function controlClasses({ invalid = false, size = "lg" }: { invalid?: boolean; size?: "md" | "lg" } = {}) {
  return (
    `${size === "lg" ? "h-12 px-4 text-base" : "h-10 px-3 text-sm"} w-full rounded border bg-surface-2 text-fg ` +
    "transition-colors placeholder:text-fg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
    "disabled:cursor-not-allowed disabled:opacity-60 " +
    (invalid ? "border-danger focus:border-danger" : "border-line-strong focus:border-accent")
  );
}

export interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  required?: boolean;
  id?: string;
}

interface ControlIds {
  id: string;
  describedBy?: string;
  invalid?: true;
}

/**
 * Label + control + hint + inline error, wired with aria-invalid / aria-describedby.
 * `children` receives the ids to put on the control.
 */
export function Field({
  label,
  error,
  hint,
  optional = false,
  required = false,
  id,
  children,
}: FieldProps & { children: (ids: ControlIds) => ReactNode }) {
  const t = useT();
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={controlId} className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        )}
        {optional && <span className="font-normal text-fg-subtle"> ({t.common.optional})</span>}
      </label>
      {children({ id: controlId, describedBy, invalid: error ? true : undefined })}
      {hint && (
        <div id={hintId} className="text-xs font-medium text-fg-muted">
          {hint}
        </div>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
