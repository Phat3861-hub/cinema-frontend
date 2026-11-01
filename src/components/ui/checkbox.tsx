"use client";

import { Check, Minus } from "lucide-react";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

/** Real checkbox (keyboard + screen readers) with a custom box; `indeterminate` for "some of the group". */
export function Checkbox({
  label,
  description,
  indeterminate = false,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode; indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={`group flex items-start gap-3 ${props.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input ref={ref} type="checkbox" className="peer absolute inset-0 cursor-[inherit] opacity-0" {...props} />
        <span
          aria-hidden
          className={
            "flex size-5 items-center justify-center rounded border transition-colors " +
            "border-line-strong bg-surface-2 peer-checked:border-primary peer-checked:bg-primary " +
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent " +
            (indeterminate ? "border-primary bg-primary" : "")
          }
        >
          {indeterminate ? (
            <Minus className="size-3.5 text-black" strokeWidth={3} />
          ) : (
            <Check className="size-3.5 text-black opacity-0 group-has-checked:opacity-100" strokeWidth={3} />
          )}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="block text-xs font-semibold text-fg-subtle">{description}</span>}
      </span>
    </label>
  );
}
