import { useId, type ComponentProps, type ReactNode } from "react";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  /** Element rendered inside the input on the right (e.g. show-password button). */
  trailing?: ReactNode;
};

/** Labelled input with hint and inline error, wired up with aria-invalid / aria-describedby. */
export function TextField({
  label,
  error,
  hint,
  optional = false,
  trailing,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-white">
        {label}
        {optional && <span className="font-normal text-neutral-400"> (không bắt buộc)</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={
            "h-12 w-full rounded border bg-neutral-850 px-4 text-base text-white transition-colors " +
            "placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 " +
            "disabled:opacity-60 " +
            (error ? "border-danger focus:border-danger " : "border-neutral-600 focus:border-primary ") +
            (trailing ? "pr-12 " : "") +
            className
          }
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
      </div>
      {hint && (
        <div id={hintId} className="text-xs font-medium text-neutral-300">
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
