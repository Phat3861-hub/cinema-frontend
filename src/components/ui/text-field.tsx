"use client";

import type { ComponentProps, ReactNode } from "react";
import { Field, controlClasses, type FieldProps } from "@/components/ui/field";

type TextFieldProps = Omit<ComponentProps<"input">, "size"> &
  FieldProps & {
    /** Element rendered inside the input on the right (e.g. show-password button). */
    trailing?: ReactNode;
    size?: "md" | "lg";
  };

/** Labelled input with hint and inline error. */
export function TextField({
  label,
  error,
  hint,
  optional,
  required,
  trailing,
  id,
  size = "lg",
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional} required={required} id={id}>
      {(ids) => (
        <div className="relative">
          <input
            id={ids.id}
            aria-invalid={ids.invalid}
            aria-describedby={ids.describedBy}
            aria-required={required || undefined}
            className={`${controlClasses({ invalid: !!error, size })} ${trailing ? "pr-12" : ""} ${className}`}
            {...props}
          />
          {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
        </div>
      )}
    </Field>
  );
}
