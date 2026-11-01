"use client";

import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { Field, controlClasses, type FieldProps } from "@/components/ui/field";

type SelectFieldProps = Omit<ComponentProps<"select">, "size"> & FieldProps & { size?: "md" | "lg" };

/** Native <select> with the field chrome (keyboard + screen reader support for free). */
export function SelectField({
  label,
  error,
  hint,
  optional,
  required,
  id,
  size = "lg",
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional} required={required} id={id}>
      {(ids) => (
        <div className="relative">
          <select
            id={ids.id}
            aria-invalid={ids.invalid}
            aria-describedby={ids.describedBy}
            className={`${controlClasses({ invalid: !!error, size })} cursor-pointer appearance-none pr-10 ${className}`}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
          />
        </div>
      )}
    </Field>
  );
}

/** Bare select for filters / toolbars (no label chrome) – pass `aria-label`. */
export function Select({ className = "", children, ...props }: Omit<ComponentProps<"select">, "size">) {
  return (
    <div className={`relative ${className}`}>
      <select className={`${controlClasses({ size: "md" })} cursor-pointer appearance-none pr-9`} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
}
