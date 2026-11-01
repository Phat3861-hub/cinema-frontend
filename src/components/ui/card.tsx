import type { ComponentProps, ReactNode } from "react";

/** White (dark: neutral-850) panel with a 16px radius – the BankDash card with Ticketor colours. */
export function Card({ className = "", children, ...props }: ComponentProps<"div">) {
  return (
    <div className={`rounded-2xl border border-line bg-surface ${className}`} {...props}>
      {children}
    </div>
  );
}

/** Section title + optional right-side actions ("See all", "Add"…). */
export function SectionHeader({
  title,
  description,
  actions,
  as: Heading = "h2",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Heading className={Heading === "h1" ? "text-h6 sm:text-h4" : "text-h8 sm:text-xl sm:font-bold"}>
          {title}
        </Heading>
        {description && <p className="mt-1 text-sm font-medium text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Icon-only button; `label` becomes the aria-label and the tooltip. */
export function IconButton({
  label,
  children,
  className = "",
  tone = "default",
  ...props
}: ComponentProps<"button"> & { label: string; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded transition-colors " +
        "focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 " +
        (tone === "danger" ? "text-danger hover:bg-danger/10 " : "text-fg-muted hover:bg-surface-2 hover:text-fg ") +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
