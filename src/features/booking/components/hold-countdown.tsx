"use client";

import { Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n";

const URGENT_MS = 2 * 60_000;

/** "mm:ss" left on the seat hold; turns red in the last 2 minutes and calls `onExpire` once at zero. */
export function HoldCountdown({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
  const t = useT();
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) {
        clearInterval(id);
        onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const left = Math.max(0, deadline - now);
  const seconds = Math.ceil(left / 1000);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const urgent = left < URGENT_MS;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        urgent ? "border-danger/40 bg-danger/10 text-danger" : "border-line bg-surface-2 text-fg"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Timer aria-hidden className="size-4" />
        {t.booking.holdTimer}
      </span>
      <span role="timer" aria-label={t.booking.holdTimeLeft(clock)} className="font-mono text-xl font-bold tabular-nums">
        {clock}
      </span>
    </div>
  );
}
