"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noopSubscribe = () => () => {};

/**
 * Content printed by `window.print()`: rendered straight under <body> and hidden on screen. The print rules in
 * `globals.css` hide every other child of <body>, so the app shell (sidebar, dialogs) never reaches the paper.
 */
export function PrintPortal({ children }: { children: ReactNode }) {
  // document only exists in the browser: the server snapshot renders nothing.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;
  return createPortal(<div className="print-root hidden print:block">{children}</div>, document.body);
}
