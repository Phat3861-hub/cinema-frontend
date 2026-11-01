import { Ticket } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

/** Brand mark: yellow ticket + "PNT Cinema" (replaces the Ticketor logo). */
export function Logo({
  label = "PNT Cinema",
  href = ROUTES.home,
  compact = false,
}: {
  label?: string;
  href?: string;
  /** Icon only (collapsed admin sidebar); the label stays for screen readers. */
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded text-2xl font-bold whitespace-nowrap text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <Ticket aria-hidden className="size-8 shrink-0 -rotate-45 fill-primary text-black" strokeWidth={1.5} />
      <span className={compact ? "sr-only" : undefined}>{label}</span>
    </Link>
  );
}
