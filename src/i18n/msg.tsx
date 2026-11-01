"use client";

import { lookup, useT, type MessageId } from "@/i18n";

/** Translated text for server components, which cannot call `useT()`: `<Msg id="nav.movies" />`. */
export function Msg({ id }: { id: MessageId }) {
  return lookup(useT(), id);
}
