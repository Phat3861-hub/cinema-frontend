"use client";

import { lookup, useT, type MessageId } from "@/i18n";

/** Title block of an auth screen (Ticketor "Sign In": centered heading under the logo). Takes message ids. */
export function AuthHeading({ title, description }: { title: MessageId; description?: MessageId }) {
  const t = useT();
  return (
    <div className="mb-8 text-center">
      <h1 className="text-h4 text-balance">{lookup(t, title)}</h1>
      {description && <p className="mt-2 text-sm font-medium text-fg-muted">{lookup(t, description)}</p>}
    </div>
  );
}
