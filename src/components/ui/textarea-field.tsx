"use client";

import type { ComponentProps } from "react";
import { Field, type FieldProps } from "@/components/ui/field";

type TextareaFieldProps = ComponentProps<"textarea"> & FieldProps;

export function TextareaField({
  label,
  error,
  hint,
  optional,
  required,
  id,
  className = "",
  rows = 4,
  ...props
}: TextareaFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional} required={required} id={id}>
      {(ids) => (
        <textarea
          id={ids.id}
          rows={rows}
          aria-invalid={ids.invalid}
          aria-describedby={ids.describedBy}
          className={
            "w-full rounded border bg-surface-2 px-4 py-3 text-base text-fg transition-colors placeholder:text-fg-subtle " +
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60 " +
            (error ? "border-danger " : "border-line-strong focus:border-accent ") +
            className
          }
          {...props}
        />
      )}
    </Field>
  );
}
