"use client";

import { useEffect, useState } from "react";

/** Seconds left before an action may be repeated (e.g. resend email); `restart()` starts a new period. */
export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return { secondsLeft, restart: (seconds: number) => setSecondsLeft(seconds) };
}
