"use client";

import { Construction } from "lucide-react";
import { lookup, useT, type MessageId } from "@/i18n";

/** Shell for screens whose backend API is not ready yet ("coming soon"); takes message ids. */
export function PagePlaceholder({ title, description }: { title: MessageId; description?: MessageId }) {
  const t = useT();
  return (
    <section className="mx-auto w-full max-w-[1232px] px-4 py-10">
      <h1 className="text-h6 sm:text-h4">{lookup(t, title)}</h1>
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
        <Construction aria-hidden className="size-10 text-fg-muted" strokeWidth={1.5} />
        <p className="text-h8">{t.common.comingSoon}</p>
        <p className="max-w-lg text-sm font-medium text-fg-muted">
          {description ? lookup(t, description) : t.common.comingSoonHint}
        </p>
      </div>
    </section>
  );
}
