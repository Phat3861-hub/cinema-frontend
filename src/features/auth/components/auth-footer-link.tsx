"use client";

import Link from "next/link";
import { lookup, useT, type MessageId } from "@/i18n";

/** "Don't have an account? Sign Up" line under the form. */
export function AuthFooterLink({ text, href, label }: { text: MessageId; href: string; label: MessageId }) {
  const t = useT();
  return (
    <p className="mt-6 text-center text-sm font-medium text-fg-2">
      {lookup(t, text)}{" "}
      <Link
        href={href}
        className="rounded font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {lookup(t, label)}
      </Link>
    </p>
  );
}
