import { Ticket } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

/** Brand mark: yellow ticket + "PNT Cinema" (replaces the Ticketor logo). */
export function Logo({ label = "PNT Cinema", href = ROUTES.home }: { label?: string; href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded text-2xl font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <Ticket aria-hidden className="size-8 -rotate-45 fill-primary text-black" strokeWidth={1.5} />
      {label}
    </Link>
  );
}
